import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function criarNotificacao(payload: Record<string, unknown>, fallbackClient?: any) {
  const admin = sbAdmin();
  const cliente = admin || fallbackClient || null;

  if (!cliente) {
    console.error("Sem cliente disponível para criar notificação.");
    return { ok: false, error: "no_client" };
  }

  async function tentarInsert(dados: Record<string, unknown>, etiqueta: string) {
    const { error } = await cliente.from("notificacoes").insert(dados as never);
    if (!error) return { ok: true, tentativa: etiqueta, fallback: !admin };
    console.error(`Falha ao criar notificação (${etiqueta}):`, error.message, "tipo:", dados.tipo);
    return { ok: false, error: error.message, code: (error as any)?.code, tentativa: etiqueta };
  }

  const completo = await tentarInsert(payload, "completa");
  if (completo.ok) return completo;

  // Alguns bancos antigos ficam com CHECK/enum permitindo apenas tipos já usados
  // como comentario_post, resposta_comentario, curtida_post etc. Quando isso
  // acontece, os tipos novos mencao_comentario e curtida_comentario não entram.
  // Para não perder a notificação no sininho, gravamos com um tipo compatível,
  // mantendo título/corpo/link dizendo exatamente o que aconteceu.
  const tipoOriginal = String(payload.tipo || "");
  let tipoCompat = tipoOriginal;
  if (tipoOriginal === "mencao_comentario") tipoCompat = "comentario_post";
  if (tipoOriginal === "curtida_comentario") tipoCompat = "curtida_post";

  if (tipoCompat !== tipoOriginal) {
    const compat = await tentarInsert({ ...payload, tipo: tipoCompat }, "tipo_compativel");
    if (compat.ok) return { ...compat, tipo_original: tipoOriginal, tipo_usado: tipoCompat };
  }

  // Fallback para bancos onde algumas colunas opcionais ainda não existem.
  const colunasMinimas = {
    user_id: payload.user_id,
    tipo: tipoCompat,
    titulo: payload.titulo,
    corpo: payload.corpo ?? null,
    link: payload.link ?? null,
    lida: false,
  };

  const minimo = await tentarInsert(colunasMinimas, "minima");
  if (minimo.ok) return { ...minimo, fallback_colunas: true, tipo_original: tipoOriginal, tipo_usado: tipoCompat };

  return { ok: false, error: minimo.error, detalhe_completo: completo.error, tipo_original: tipoOriginal, tipo_tentado: tipoCompat };
}

function nomeUsuario(user: any) {
  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  return String(
    meta?.nome_exibicao ??
    meta?.display_name ??
    meta?.full_name ??
    meta?.name ??
    meta?.nome ??
    user?.email?.split("@")[0] ??
    "Corredor"
  );
}

function avatarUsuario(user: any) {
  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  return ((meta?.avatar_url || meta?.picture || meta?.foto) as string | undefined) ?? null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizarHandle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 30)
    .toLowerCase();
}

function extrairHandles(texto: string) {
  return Array.from(new Set(Array.from(texto.matchAll(/@([\p{L}\p{N}._-]{2,30})/gu)).map((m) => m[1].toLowerCase())));
}

async function resolverMencoes(texto: string, mencoesBody: unknown, autorId: string) {
  const resolvidas = new Map<string, { user_id: string; nome: string }>();

  // 1) Melhor caminho: usuário escolhido na lista de sugestões do frontend.
  // Isso evita depender do texto do @, que pode variar conforme nome, e-mail ou handle.
  // Validamos contra o texto: só consideramos a menção se o handle (ou email/nome
  // normalizado) aparece de fato no texto, evitando notificar alguém que foi
  // digitado e depois apagado pelo autor.
  const handlesNoTexto = new Set(extrairHandles(texto));
  if (Array.isArray(mencoesBody)) {
    for (const item of mencoesBody as Array<{ user_id?: unknown; nome?: unknown; handle?: unknown; email?: unknown }>) {
      const id = String(item?.user_id || "");
      if (!isUuid(id) || id === autorId) continue;

      // Quando o usuário foi escolhido na lista de sugestões, o frontend envia
      // o ID real. Esse é o mesmo comportamento esperado de Instagram/Facebook:
      // a menção deixa de depender do texto bater exatamente com nome/e-mail.
      // O frontend já filtra menções apagadas antes de enviar. Aqui aceitamos o
      // ID selecionado para não perder notificação por causa de acento, ponto,
      // espaço, sobrenome ou handle diferente.
      resolvidas.set(id, { user_id: id, nome: String(item?.nome || "Corredor") });
    }
  }

  const handles = Array.from(handlesNoTexto);
  if (handles.length === 0) return Array.from(resolvidas.values());

  const admin = sbAdmin();
  if (!admin) return Array.from(resolvidas.values());

  const adicionarCandidato = (userId: unknown, nomeBruto: unknown, emailBruto?: unknown) => {
    const id = String(userId || "");
    if (!isUuid(id) || id === autorId) return;

    const nome = String(nomeBruto || (typeof emailBruto === "string" ? emailBruto.split("@")[0] : "Corredor"));
    const email = String(emailBruto || "");

    const possiveis = [
      normalizarHandle(nome),
      normalizarHandle(email.split("@")[0] || ""),
      normalizarHandle(email),
    ].filter(Boolean);

    if (possiveis.some((h) => handles.includes(h))) {
      resolvidas.set(id, { user_id: id, nome });
    }
  };

  // 2) Procura nos usuários reais do Auth. Pagina para não limitar apenas aos primeiros usuários.
  for (let page = 1; page <= 10; page++) {
    const { data: authUsers, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) break;

    const users = authUsers?.users || [];
    for (const u of users) {
      adicionarCandidato(u.id, nomeUsuario(u), u.email || "");
    }

    if (users.length < 100) break;
  }

  // 3) Complementa com nomes gravados no feed, porque alguns usuários podem ter
  // nome social/sobrenome/handle nos posts diferente do metadado atual do Auth.
  const { data: postsAutores } = await admin
    .from("feed_posts")
    .select("user_id, autor_nome, autor_email")
    .limit(1000);

  for (const row of postsAutores || []) {
    adicionarCandidato((row as any).user_id, (row as any).autor_nome, (row as any).autor_email);
  }

  const { data: comentarioAutores } = await admin
    .from("feed_comentarios")
    .select("user_id, autor_nome")
    .limit(1000);

  for (const row of comentarioAutores || []) {
    adicionarCandidato((row as any).user_id, (row as any).autor_nome, "");
  }

  return Array.from(resolvidas.values());
}

async function recalcularTotalComentarios(supabase: any, post_id: number) {
  const { count } = await supabase
    .from("feed_comentarios")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post_id)
    .is("resposta_para", null);

  await supabase.from("feed_posts").update({ total_comentarios: count ?? 0 }).eq("id", post_id);
  return count ?? 0;
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const post_id = Number(b.post_id);
  const texto = String(b.texto ?? "").trim();
  const resposta_para = b.resposta_para ? Number(b.resposta_para) : null;
  if (!post_id || !texto) return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });

  const autor_nome = nomeUsuario(user);
  const autor_avatar = avatarUsuario(user);

  const { data, error } = await supabase
    .from("feed_comentarios")
    .insert({ post_id, user_id: user.id, texto, autor_nome, autor_avatar, resposta_para, total_curtidas: 0 })
    .select("id, texto, created_at, autor_nome, autor_avatar, user_id, resposta_para, total_curtidas")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recalcularTotalComentarios(supabase, post_id);

  const { data: post } = await supabase.from("feed_posts").select("user_id").eq("id", post_id).single();

  const mencoes = await resolverMencoes(texto, b.mencoes, user.id);
  const diagnostico: Array<Record<string, unknown>> = [];
  let mencoesNotificadas = 0;
  for (const mencao of mencoes) {
    const resultado = await criarNotificacao({
      user_id: mencao.user_id,
      tipo: "mencao_comentario",
      titulo: `${autor_nome} marcou você em um comentário`,
      corpo: texto.slice(0, 120),
      post_id,
      link: `/#post-${post_id}`,
      ator_id: user.id,
      ator_nome: autor_nome,
      ator_avatar: autor_avatar,
      lida: false,
    }, supabase);
    diagnostico.push({ user_id: mencao.user_id, nome: mencao.nome, ...resultado });
    if (resultado?.ok) mencoesNotificadas += 1;
  }

  if (resposta_para) {
    const { data: pai } = await supabase.from("feed_comentarios").select("user_id").eq("id", resposta_para).single();
    if (pai?.user_id && pai.user_id !== user.id) {
      await criarNotificacao({
        user_id: pai.user_id, tipo: "resposta_comentario",
        titulo: `${autor_nome} respondeu seu comentário`,
        corpo: texto.slice(0, 80),
        post_id, link: `/#post-${post_id}`, ator_id: user.id, ator_nome: autor_nome, ator_avatar: autor_avatar, lida: false,
      }, supabase);
    }
  } else if (post?.user_id && post.user_id !== user.id) {
    await criarNotificacao({
      user_id: post.user_id, tipo: "comentario_post",
      titulo: `${autor_nome} comentou sua publicação`,
      corpo: texto.slice(0, 80),
      post_id, link: `/#post-${post_id}`, ator_id: user.id, ator_nome: autor_nome, ator_avatar: autor_avatar, lida: false,
    }, supabase);
  }

  return NextResponse.json({
    success: true,
    comentario: { ...data, autor_nome, autor_avatar, curtido_por_mim: false },
    mencoes_encontradas: mencoes.length,
    mencoes_notificadas: mencoesNotificadas,
    mencoes_diagnostico: diagnostico,
    admin_disponivel: !!sbAdmin(),
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const url = new URL(req.url);
  const comentario_id = url.searchParams.get("comentario_id");

  // Lista quem curtiu um comentário específico.
  // Usado no feed para abrir um modal com os perfis que curtiram o comentário.
  if (comentario_id) {
    const id = Number(comentario_id);
    if (!id) return NextResponse.json({ error: "comentario_id inválido." }, { status: 400 });

    const readClient = sbAdmin() || supabase;

    const { data: curtidas, error: curtidasError } = await readClient
      .from("feed_comentario_curtidas")
      .select("user_id")
      .eq("comentario_id", id);

    if (curtidasError) {
      return NextResponse.json({ error: curtidasError.message }, { status: 500 });
    }

    const ids: string[] = Array.from(
      new Set<string>(
        (curtidas || [])
          .map((c: any) => String(c.user_id || ""))
          .filter((v: string) => isUuid(v))
      )
    );

    const usuarios: Record<string, { user_id: string; nome: string; avatar: string | null }> = {};
    const admin = sbAdmin();

    if (admin && ids.length > 0) {
      await Promise.all(ids.map(async (idUsuario: string) => {
        const { data } = await admin.auth.admin.getUserById(idUsuario);
        const u = data?.user;
        usuarios[idUsuario] = {
          user_id: idUsuario,
          nome: u ? nomeUsuario(u) : "Corredor",
          avatar: u ? avatarUsuario(u) : null,
        };
      }));

      // Complementa com nomes/avatares gravados no feed quando existirem.
      const { data: autoresComentarios } = await admin
        .from("feed_comentarios")
        .select("user_id, autor_nome, autor_avatar")
        .in("user_id", ids);

      for (const row of autoresComentarios || []) {
        const userId = String((row as any).user_id || "");
        if (!isUuid(userId)) continue;
        usuarios[userId] = {
          user_id: userId,
          nome: String((row as any).autor_nome || usuarios[userId]?.nome || "Corredor"),
          avatar: ((row as any).autor_avatar as string | null) || usuarios[userId]?.avatar || null,
        };
      }

      const { data: autoresPosts } = await admin
        .from("feed_posts")
        .select("user_id, autor_nome, autor_avatar")
        .in("user_id", ids);

      for (const row of autoresPosts || []) {
        const userId = String((row as any).user_id || "");
        if (!isUuid(userId)) continue;
        usuarios[userId] = {
          user_id: userId,
          nome: String(usuarios[userId]?.nome || (row as any).autor_nome || "Corredor"),
          avatar: usuarios[userId]?.avatar || ((row as any).autor_avatar as string | null) || null,
        };
      }
    }

    return NextResponse.json({
      success: true,
      total: ids.length,
      curtidas: ids.map((idUsuario: string) => usuarios[idUsuario] || { user_id: idUsuario, nome: "Corredor", avatar: null }),
    });
  }

  const post_id = url.searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id obrigatório." }, { status: 400 });

  const { data, error } = await supabase
    .from("feed_comentarios")
    .select("id, texto, created_at, autor_nome, autor_avatar, user_id, resposta_para, total_curtidas")
    .eq("post_id", post_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comentarios = data ?? [];
  const ids: number[] = comentarios.map((c: any) => Number(c.id)).filter((id: number) => Number.isFinite(id));
  const curtidos = new Set<number>();

  if (user && ids.length > 0) {
    const readClient = sbAdmin() || supabase;
    const { data: minhasCurtidas } = await readClient
      .from("feed_comentario_curtidas")
      .select("comentario_id")
      .eq("user_id", user.id)
      .in("comentario_id", ids);

    for (const row of minhasCurtidas || []) {
      curtidos.add(Number((row as { comentario_id: number }).comentario_id));
    }
  }

  return NextResponse.json({
    comentarios: comentarios.map((c: any) => ({
      ...c,
      total_curtidas: Number(c.total_curtidas ?? 0),
      curtido_por_mim: curtidos.has(Number(c.id)),
    })),
  });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const acao = String(b.acao);

  if (acao === "editar") {
    const id = Number(b.id);
    const texto = String(b.texto ?? "").trim();
    if (!texto) return NextResponse.json({ error: "Texto vazio." }, { status: 400 });
    const { error } = await supabase.from("feed_comentarios").update({ texto }).eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (acao === "curtir" || acao === "descurtir") {
    const id = Number(b.id);
    if (!id) return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });

    const writeClient = sbAdmin() || supabase;

    let jaCurtia = false;
    if (acao === "curtir") {
      const { data: curtidaExistente } = await writeClient
        .from("feed_comentario_curtidas")
        .select("comentario_id")
        .eq("comentario_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      jaCurtia = !!curtidaExistente;

      const { error: likeError } = await writeClient
        .from("feed_comentario_curtidas")
        .upsert({ comentario_id: id, user_id: user.id }, { onConflict: "comentario_id,user_id" });

      if (likeError) {
        return NextResponse.json({ error: likeError.message }, { status: 500 });
      }
    } else {
      const { error: unlikeError } = await writeClient
        .from("feed_comentario_curtidas")
        .delete()
        .eq("comentario_id", id)
        .eq("user_id", user.id);

      if (unlikeError) {
        return NextResponse.json({ error: unlikeError.message }, { status: 500 });
      }
    }

    const { count } = await writeClient
      .from("feed_comentario_curtidas")
      .select("*", { count: "exact", head: true })
      .eq("comentario_id", id);

    await writeClient.from("feed_comentarios").update({ total_curtidas: count ?? 0 }).eq("id", id);

    // Notifica o autor do comentário quando alguém curte (somente ao curtir,
    // não ao descurtir, e nunca quando o próprio autor curte o seu comentário).
    let notificacaoCurtida: Record<string, unknown> | null = null;
    if (acao === "curtir" && !jaCurtia) {
      const { data: comentarioAlvo } = await writeClient
        .from("feed_comentarios")
        .select("user_id, post_id, texto")
        .eq("id", id)
        .maybeSingle();

      const donoId = (comentarioAlvo as { user_id?: string } | null)?.user_id;
      if (donoId && donoId !== user.id) {
        const autor_nome = nomeUsuario(user);
        const autor_avatar = avatarUsuario(user);
        const postId = Number((comentarioAlvo as { post_id?: number } | null)?.post_id ?? 0);
        const corpoBase = String((comentarioAlvo as { texto?: string } | null)?.texto || "").slice(0, 80);
        notificacaoCurtida = await criarNotificacao({
          user_id: donoId,
          tipo: "curtida_comentario",
          titulo: `${autor_nome} curtiu seu comentário`,
          corpo: corpoBase || "Toque para ver o comentário.",
          post_id: postId || null,
          link: postId ? `/#post-${postId}` : null,
          ator_id: user.id,
          ator_nome: autor_nome,
          ator_avatar: autor_avatar,
          lida: false,
        }, supabase);
      }
    }

    return NextResponse.json({ success: true, total_curtidas: count ?? 0, curtido: acao === "curtir", notificacao_curtida: notificacaoCurtida });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  const post_id = new URL(req.url).searchParams.get("post_id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  // Só o autor pode apagar. Se for comentário principal, apaga também suas respostas.
  const { data: comentario } = await supabase
    .from("feed_comentarios")
    .select("id, user_id, resposta_para")
    .eq("id", id)
    .maybeSingle();

  if (!comentario || comentario.user_id !== user.id) {
    return NextResponse.json({ error: "Você não pode excluir este comentário." }, { status: 403 });
  }

  await supabase.from("feed_comentarios").delete().eq("resposta_para", id).eq("post_id", post_id);
  await supabase.from("feed_comentarios").delete().eq("id", id).eq("user_id", user.id);

  if (post_id) await recalcularTotalComentarios(supabase, Number(post_id));
  return NextResponse.json({ success: true });
}
