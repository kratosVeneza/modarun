import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";

type Destino = "todos" | "cidade" | "usuario";
type AuthUserResumo = { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null };

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  return res;
}

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizarTexto(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function extrairCidadeMeta(meta: Record<string, unknown> | null | undefined) {
  const cidade = meta?.cidade || meta?.city || meta?.cidade_interesse || meta?.localidade || meta?.municipio;
  return typeof cidade === "string" ? cidade : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

async function verificarAdmin(): Promise<{ error?: NextResponse }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email?.toLowerCase() ?? "")
    .maybeSingle();

  if (!adminRow) return { error: json({ error: "Acesso negado." }, { status: 403 }) };
  return {};
}

async function listarUsuariosAuth(admin: SupabaseClient): Promise<AuthUserResumo[]> {
  const todos: AuthUserResumo[] = [];
  let page = 1;
  const perPage = 1000;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = (data?.users || []) as AuthUserResumo[];
    todos.push(...users);
    if (users.length < perPage) break;
    page += 1;
  }

  return todos;
}

async function buscarUserIdsPorDestino(admin: SupabaseClient, destino: Destino, cidade?: string | null, userIdAlvo?: string | null) {
  const ids = new Set<string>();

  if (destino === "usuario") {
    if (!userIdAlvo || !isUuid(userIdAlvo)) throw new Error("Selecione um usuário válido.");
    const { data, error } = await admin.auth.admin.getUserById(userIdAlvo);
    if (error || !data?.user) throw new Error("Usuário não encontrado.");
    ids.add(userIdAlvo);
    return [...ids];
  }

  if (destino === "todos") {
    const usuarios = await listarUsuariosAuth(admin);
    usuarios.forEach((u) => { if (u.id) ids.add(u.id); });
    const { data: posts } = await admin.from("feed_posts").select("user_id").limit(5000);
    (posts || []).forEach((p: { user_id?: string | null }) => { if (p.user_id) ids.add(p.user_id); });
    return [...ids];
  }

  const termo = normalizarTexto(cidade || "");
  if (!termo) throw new Error("Informe a cidade.");

  const { data: cidadesInteresse } = await admin
    .from("user_cidades_interesse")
    .select("user_id, cidade")
    .ilike("cidade", `%${cidade}%`)
    .limit(5000);

  (cidadesInteresse || []).forEach((c: { user_id?: string | null }) => {
    if (c.user_id) ids.add(c.user_id);
  });

  const usuarios = await listarUsuariosAuth(admin);
  usuarios.forEach((u) => {
    const cidadeMeta = normalizarTexto(extrairCidadeMeta(u.user_metadata));
    if (cidadeMeta && cidadeMeta.includes(termo)) ids.add(u.id);
  });

  return [...ids];
}

function prepararLink(link: string | null) {
  if (!link) return null;
  const l = link.trim();
  if (!l) return null;
  if (l.startsWith("/") || l.startsWith("https://") || l.startsWith("http://")) return l;
  return `/${l}`;
}

export async function GET(req: Request): Promise<NextResponse> {
  const auth = await verificarAdmin();
  if (auth.error) return auth.error;

  const admin = criarAdminClient();
  if (!admin) return json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel." }, { status: 500 });

  const url = new URL(req.url);
  const destino = (url.searchParams.get("destino") || "todos") as Destino;
  const cidade = url.searchParams.get("cidade");
  const userId = url.searchParams.get("user_id");
  if (!["todos", "cidade", "usuario"].includes(destino)) return json({ error: "Destino inválido." }, { status: 400 });

  try {
    const ids = await buscarUserIdsPorDestino(admin, destino, cidade, userId);
    return json({ success: true, total: ids.length, destino });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro ao calcular destinatários." }, { status: 400 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const auth = await verificarAdmin();
  if (auth.error) return auth.error;

  const admin = criarAdminClient();
  if (!admin) return json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel." }, { status: 500 });

  const b = await req.json();
  const titulo = String(b.titulo ?? "").trim().slice(0, 90);
  const corpo = String(b.corpo ?? "").trim().slice(0, 600);
  const destino = String(b.destino ?? "todos") as Destino;
  const cidade = b.cidade ? String(b.cidade).trim() : null;
  const userIdAlvo = b.user_id ? String(b.user_id).trim() : null;
  const link = prepararLink(b.link ? String(b.link) : null);

  if (!titulo) return json({ error: "Título obrigatório." }, { status: 400 });
  if (!["todos", "cidade", "usuario"].includes(destino)) return json({ error: "Destino inválido." }, { status: 400 });

  let userIds: string[] = [];
  try {
    userIds = await buscarUserIdsPorDestino(admin, destino, cidade, userIdAlvo);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro ao buscar destinatários." }, { status: 400 });
  }

  userIds = [...new Set(userIds)].filter(Boolean);
  if (userIds.length === 0) return json({ success: true, enviadas: 0, destino, mensagem: "Nenhum destinatário encontrado." });

  const base = { tipo: "mensagem_admin", titulo, corpo: corpo || null, link, ator_nome: "Moda Run", ator_avatar: null, post_id: null, lida: false };
  let enviadas = 0;
  const tamanhoLote = 500;

  for (let i = 0; i < userIds.length; i += tamanhoLote) {
    const lote = userIds.slice(i, i + tamanhoLote).map((uid) => ({ ...base, user_id: uid }));
    const { error } = await admin.from("notificacoes").insert(lote as never);
    if (error) return json({ error: error.message, enviadas }, { status: 500 });
    enviadas += lote.length;
  }

  return json({ success: true, enviadas, destino });
}
