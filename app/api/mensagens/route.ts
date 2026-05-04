import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type MensagemRow = {
  id: number;
  remetente_id: string;
  destinatario_id: string;
  texto: string | null;
  lida: boolean | null;
  created_at: string;
  lida_em?: string | null;
  apagada_para_todos?: boolean | null;
  apagada_em?: string | null;
  apagada_por?: string | null;
  oculta_para?: string[] | null;
};

type PerfilUsuario = {
  user_id: string;
  autor_nome: string | null;
  autor_avatar: string | null;
  autor_email: string | null;
};

function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function usuarioParticipa(m: MensagemRow, userId: string) {
  return m.remetente_id === userId || m.destinatario_id === userId;
}

function visivelParaUsuario(m: MensagemRow, userId: string) {
  return !(m.oculta_para || []).includes(userId);
}

function sanitizarMensagem(m: MensagemRow) {
  if (m.apagada_para_todos) {
    return {
      ...m,
      texto: "Mensagem apagada",
    };
  }

  return m;
}

function nomeDoAuth(user: any) {
  const meta = user?.user_metadata || {};
  return (
    meta.nome_exibicao ||
    meta.display_name ||
    meta.full_name ||
    meta.name ||
    meta.nome ||
    user?.email?.split("@")[0] ||
    "Corredor"
  );
}

function avatarDoAuth(user: any) {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || meta.foto || null;
}

async function buscarPerfis(userIds: string[]) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return new Map<string, PerfilUsuario>();

  const admin = sbAdmin();
  if (!admin) return new Map<string, PerfilUsuario>();

  const mapa = new Map<string, PerfilUsuario>();

  // 1) Fonte principal: Auth, porque contém o nome atualizado do perfil.
  await Promise.all(ids.map(async (id) => {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data?.user) {
      mapa.set(id, {
        user_id: id,
        autor_nome: nomeDoAuth(data.user),
        autor_avatar: avatarDoAuth(data.user),
        autor_email: data.user.email || null,
      });
    }
  }));

  // 2) Complemento/fallback: último post do feed.
  const { data } = await admin
    .from("feed_posts")
    .select("user_id, autor_nome, autor_avatar, autor_email, created_at")
    .in("user_id", ids)
    .order("created_at", { ascending: false });

  for (const row of data || []) {
    const p = row as PerfilUsuario;
    const atual = mapa.get(p.user_id);
    mapa.set(p.user_id, {
      user_id: p.user_id,
      autor_nome: atual?.autor_nome && atual.autor_nome !== "Corredor" ? atual.autor_nome : (p.autor_nome || atual?.autor_nome || "Corredor"),
      autor_avatar: atual?.autor_avatar || p.autor_avatar || null,
      autor_email: atual?.autor_email || p.autor_email || null,
    });
  }

  return mapa;
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const outroId = url.searchParams.get("outro_id") || url.searchParams.get("user") || "";
  const resumo = url.searchParams.get("resumo") === "1" || url.searchParams.get("summary") === "1";

  if (resumo) {
    const { count, error } = await supabase
      .from("mensagens")
      .select("*", { count: "exact", head: true })
      .eq("destinatario_id", user.id)
      .eq("lida", false)
      .eq("apagada_para_todos", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ total_nao_lidas: count ?? 0 });
  }

  if (outroId) {
    if (!isUuid(outroId) || outroId === user.id) {
      return NextResponse.json({ error: "Conversa inválida." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("mensagens")
      .select("id, remetente_id, destinatario_id, texto, lida, created_at, lida_em, apagada_para_todos, apagada_em, apagada_por, oculta_para")
      .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${outroId}),and(remetente_id.eq.${outroId},destinatario_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mensagens = ((data || []) as MensagemRow[])
      .filter((m) => visivelParaUsuario(m, user.id))
      .map(sanitizarMensagem);

    await supabase
      .from("mensagens")
      .update({ lida: true, lida_em: new Date().toISOString() } as never)
      .eq("destinatario_id", user.id)
      .eq("remetente_id", outroId)
      .eq("lida", false);

    const perfis = await buscarPerfis([outroId]);
    const perfil = perfis.get(outroId) || null;

    return NextResponse.json({
      mensagens,
      outro: perfil ? {
        id: outroId,
        nome: perfil.autor_nome || "Corredor",
        avatar: perfil.autor_avatar || null,
        email: perfil.autor_email || null,
      } : { id: outroId, nome: "Corredor", avatar: null, email: null },
    });
  }

  const { data, error } = await supabase
    .from("mensagens")
    .select("id, remetente_id, destinatario_id, texto, lida, created_at, lida_em, apagada_para_todos, apagada_em, apagada_por, oculta_para")
    .or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const todas = ((data || []) as MensagemRow[])
    .filter((m) => visivelParaUsuario(m, user.id));

  const conversasMap = new Map<string, {
    outro_id: string;
    ultima_mensagem: MensagemRow;
    nao_lidas: number;
  }>();

  for (const m of todas) {
    const outroIdConversa = m.remetente_id === user.id ? m.destinatario_id : m.remetente_id;
    const existente = conversasMap.get(outroIdConversa);

    if (!existente) {
      conversasMap.set(outroIdConversa, {
        outro_id: outroIdConversa,
        ultima_mensagem: sanitizarMensagem(m),
        nao_lidas: m.destinatario_id === user.id && !m.lida ? 1 : 0,
      });
    } else if (m.destinatario_id === user.id && !m.lida) {
      existente.nao_lidas += 1;
    }
  }

  const ids = Array.from(conversasMap.keys());
  const perfis = await buscarPerfis(ids);

  const conversas = Array.from(conversasMap.values()).map((c) => {
    const p = perfis.get(c.outro_id);
    return {
      ...c,
      outro_nome: p?.autor_nome || "Corredor",
      outro_avatar: p?.autor_avatar || null,
      outro_email: p?.autor_email || null,
      ultima_msg: c.ultima_mensagem.texto || "",
      created_at: c.ultima_mensagem.created_at,
      remetente_id: c.ultima_mensagem.remetente_id,
      destinatario_id: c.ultima_mensagem.destinatario_id,
      lida: c.ultima_mensagem.lida,
    };
  });

  return NextResponse.json({ conversas });
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const texto = String(body.texto ?? "").trim();
  const destinatarioId = String(body.destinatario_id ?? "").trim();

  if (!isUuid(destinatarioId)) {
    return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
  }

  if (destinatarioId === user.id) {
    return NextResponse.json({ error: "Você não pode enviar mensagem para você mesmo." }, { status: 400 });
  }

  if (!texto) {
    return NextResponse.json({ error: "Digite uma mensagem." }, { status: 400 });
  }

  if (texto.length > 1200) {
    return NextResponse.json({ error: "A mensagem deve ter no máximo 1200 caracteres." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("mensagens")
    .insert({
      remetente_id: user.id,
      destinatario_id: destinatarioId,
      texto,
      lida: false,
    } as never)
    .select("id, remetente_id, destinatario_id, texto, lida, created_at, lida_em, apagada_para_todos, apagada_em, apagada_por, oculta_para")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const admin = sbAdmin();
  if (admin) {
    const nome = nomeDoAuth(user);
    const avatar = avatarDoAuth(user);
    await admin.from("notificacoes").insert({
      user_id: destinatarioId,
      tipo: "mensagem_privada",
      titulo: `Nova mensagem de ${nome}`,
      corpo: texto.length > 90 ? `${texto.slice(0, 90)}...` : texto,
      link: `/chat?user=${user.id}`,
      ator_nome: nome,
      ator_avatar: avatar,
    } as never);
  }

  return NextResponse.json({ success: true, mensagem: data });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const acao = String(body.acao ?? "");

  if (acao === "marcar_lidas") {
    const outroId = String(body.outro_id ?? "").trim();
    if (!isUuid(outroId)) return NextResponse.json({ error: "Conversa inválida." }, { status: 400 });

    const { error } = await supabase
      .from("mensagens")
      .update({ lida: true, lida_em: new Date().toISOString() } as never)
      .eq("destinatario_id", user.id)
      .eq("remetente_id", outroId)
      .eq("lida", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const modo = url.searchParams.get("modo") || "para_mim";

  if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

  const writeClient = sbAdmin() || supabase;

  const { data: msg, error: readError } = await writeClient
    .from("mensagens")
    .select("id, remetente_id, destinatario_id, oculta_para")
    .eq("id", id)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!msg || !usuarioParticipa(msg as MensagemRow, user.id)) {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }

  const mensagem = msg as MensagemRow;

  if (modo === "todos") {
    if (mensagem.remetente_id !== user.id) {
      return NextResponse.json({ error: "Somente quem enviou pode apagar para todos." }, { status: 403 });
    }

    const { error } = await writeClient
      .from("mensagens")
      .update({
        apagada_para_todos: true,
        apagada_em: new Date().toISOString(),
        apagada_por: user.id,
        texto: "Mensagem apagada",
      } as never)
      .eq("id", id)
      .eq("remetente_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, modo: "todos" });
  }

  const ocultos = Array.isArray(mensagem.oculta_para) ? mensagem.oculta_para : [];
  const novaLista = Array.from(new Set([...ocultos, user.id]));

  const { error } = await writeClient
    .from("mensagens")
    .update({ oculta_para: novaLista } as never)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, modo: "para_mim" });
}
