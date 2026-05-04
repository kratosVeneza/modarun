import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type FeedPost = {
  id: number;
  user_id: string;
  [key: string]: unknown;
};

function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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

function nomeUsuario(user: any) {
  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  return String(
    meta?.nome_exibicao ?? meta?.display_name ?? meta?.full_name ?? meta?.name ?? meta?.nome ?? user?.email?.split("@")[0] ?? "Corredor"
  );
}

async function criarNotificacaoSegura(payload: Record<string, unknown>) {
  const admin = sbAdmin();
  if (!admin) return;
  const { error } = await admin.from("notificacoes").insert(payload as never);
  if (!error) return;
  // Fallback com colunas mínimas, caso o banco ainda não tenha as opcionais.
  const fallback = {
    user_id: payload.user_id,
    tipo: payload.tipo,
    titulo: payload.titulo,
    corpo: payload.corpo ?? null,
    link: payload.link ?? null,
    lida: false,
  };
  await admin.from("notificacoes").insert(fallback as never);
}

async function notificarSeguidores(autorId: string, autorNome: string, autorAvatar: string | null, postId: number, resumo: string | null) {
  const admin = sbAdmin();
  if (!admin) return;
  // Pega todos que seguem o autor.
  const { data: seguidores } = await admin
    .from("follows")
    .select("follower_id")
    .eq("following_id", autorId)
    .limit(2000);

  for (const row of seguidores || []) {
    const id = String((row as { follower_id: string }).follower_id || "");
    if (!isUuid(id) || id === autorId) continue;
    await criarNotificacaoSegura({
      user_id: id,
      tipo: "novo_post",
      titulo: `${autorNome} publicou algo novo`,
      corpo: resumo ? resumo.slice(0, 120) : "Toque para ver a publicação.",
      post_id: postId,
      link: `/#post-${postId}`,
      ator_id: autorId,
      ator_nome: autorNome,
      ator_avatar: autorAvatar,
      lida: false,
    });
  }
}

async function notificarMencoesEmTexto(texto: string, autorId: string, autorNome: string, autorAvatar: string | null, postId: number) {
  if (!texto) return;
  const handles = extrairHandles(texto);
  if (handles.length === 0) return;

  const admin = sbAdmin();
  if (!admin) return;

  const notificados = new Set<string>();
  const tentar = (id: string, nome: string, email: string) => {
    if (!isUuid(id) || id === autorId || notificados.has(id)) return;
    const possiveis = [normalizarHandle(nome), normalizarHandle(email.split("@")[0] || ""), normalizarHandle(email)].filter(Boolean);
    if (!possiveis.some((h) => handles.includes(h))) return;
    notificados.add(id);
    criarNotificacaoSegura({
      user_id: id,
      tipo: "mencao_post",
      titulo: `${autorNome} marcou você em uma publicação`,
      corpo: texto.slice(0, 120),
      post_id: postId,
      link: `/#post-${postId}`,
      ator_id: autorId,
      ator_nome: autorNome,
      ator_avatar: autorAvatar,
      lida: false,
    }).catch(() => undefined);
  };

  // Pagina nos usuários do Auth.
  for (let page = 1; page <= 10; page++) {
    const { data: authUsers, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) break;
    const users = authUsers?.users || [];
    for (const u of users) tentar(u.id, nomeUsuario(u), u.email || "");
    if (users.length < 100) break;
  }

  // Complementa pelos autores conhecidos.
  const { data: postsAutores } = await admin
    .from("feed_posts").select("user_id, autor_nome, autor_email").limit(1000);
  for (const row of postsAutores || []) tentar(String((row as any).user_id), String((row as any).autor_nome || ""), String((row as any).autor_email || ""));
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const tipo = String(b.tipo ?? "");
  const texto = b.texto ? String(b.texto).trim() : null;
  const fotos = Array.isArray(b.fotos) ? b.fotos as string[] : [];

  if (!["post", "atividade"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo invalido." }, { status: 400 });
  }
  if (!texto && fotos.length === 0 && tipo !== "atividade") {
    return NextResponse.json({ error: "Post precisa de texto ou foto." }, { status: 400 });
  }

  const meta = user.user_metadata as Record<string, unknown>;
  const autor_nome = String(meta?.nome_exibicao ?? meta?.display_name ?? meta?.full_name ?? meta?.name ?? meta?.nome ?? user.email?.split("@")[0] ?? "Corredor");
  const autor_avatar = ((meta?.avatar_url || meta?.picture) as string | undefined) ?? null;
  const autor_email = user.email ?? null;

  const payload: Record<string, unknown> = {
    user_id: user.id,
    tipo,
    texto,
    fotos,
    autor_nome,
    autor_avatar,
    autor_email,
    total_curtidas: 0,
    total_comentarios: 0,
  };

  if (tipo === "atividade") {
    payload.atividade_distancia = b.atividade_distancia ?? null;
    payload.atividade_tempo = b.atividade_tempo ? String(b.atividade_tempo).trim() : null;
    payload.atividade_pace = b.atividade_pace ? String(b.atividade_pace).trim() : null;
    payload.atividade_tipo = b.atividade_tipo ? String(b.atividade_tipo).trim() : "Corrida";
  }

  const { data, error } = await supabase
    .from("feed_posts")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notifica seguidores e usuários mencionados no texto. Não bloqueia a resposta.
  const postId = Number((data as { id: number }).id);
  if (Number.isFinite(postId) && postId > 0) {
    notificarSeguidores(user.id, autor_nome, autor_avatar, postId, texto).catch(() => undefined);
    if (texto) notificarMencoesEmTexto(texto, user.id, autor_nome, autor_avatar, postId).catch(() => undefined);
  }

  return NextResponse.json({ success: true, post: { ...data, curtido_por_mim: false, seguindo_autor: false } });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const page = parseInt(new URL(req.url).searchParams.get("page") ?? "0");
  const limite = 15;

  const { data, error } = await supabase
    .from("feed_posts_view")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * limite, (page + 1) * limite - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let posts = (data ?? []) as FeedPost[];

  if (posts.length > 0) {
    const postIds = posts.map((p) => p.id);

    // Recalcula curtidas e comentários a partir das tabelas reais.
    // Assim o feed não fica dependente de campos antigos/desatualizados da view.
    const [{ data: todasCurtidas }, { data: todosComentarios }] = await Promise.all([
      supabase.from("feed_curtidas").select("post_id").in("post_id", postIds),
      supabase.from("feed_comentarios").select("post_id").in("post_id", postIds).is("resposta_para", null),
    ]);

    const mapaCurtidas = new Map<number, number>();
    for (const c of todasCurtidas || []) {
      const id = Number((c as { post_id: number }).post_id);
      mapaCurtidas.set(id, (mapaCurtidas.get(id) || 0) + 1);
    }

    const mapaComentarios = new Map<number, number>();
    for (const c of todosComentarios || []) {
      const id = Number((c as { post_id: number }).post_id);
      mapaComentarios.set(id, (mapaComentarios.get(id) || 0) + 1);
    }

    posts = posts.map((p) => ({
      ...p,
      total_curtidas: mapaCurtidas.get(p.id) ?? Number(p.total_curtidas ?? 0),
      total_comentarios: mapaComentarios.get(p.id) ?? Number(p.total_comentarios ?? 0),
    }));
  }

  if (user && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const autores = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];

    const [{ data: curtidas }, { data: follows }] = await Promise.all([
      supabase
        .from("feed_curtidas")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", autores),
    ]);

    const curtidasSet = new Set((curtidas || []).map((c: { post_id: number }) => c.post_id));
    const followsSet = new Set((follows || []).map((f: { following_id: string }) => f.following_id));

    posts = posts.map((p) => ({
      ...p,
      curtido_por_mim: curtidasSet.has(p.id),
      seguindo_autor: followsSet.has(p.user_id),
    }));
  }

  return NextResponse.json({ posts, pagina: page, tem_mais: posts.length === limite });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatorio." }, { status: 400 });

  await supabase.from("feed_posts").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
