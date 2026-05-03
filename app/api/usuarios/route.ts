import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type UsuarioFeed = {
  user_id: string;
  autor_nome: string | null;
  autor_avatar: string | null;
  autor_email: string | null;
  created_at?: string;
};

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function usuarioAuthParaBusca(u: any): UsuarioFeed {
  const nomeMeta = u.user_metadata?.name || u.user_metadata?.full_name || u.user_metadata?.nome || u.user_metadata?.autor_nome;
  const avatarMeta = u.user_metadata?.avatar_url || u.user_metadata?.picture || null;
  return { user_id: u.id, autor_nome: nomeMeta || u.email?.split("@")[0] || "Corredor", autor_avatar: avatarMeta, autor_email: u.email || null, created_at: u.created_at };
}

function deduplicarUsuarios(rows: UsuarioFeed[], limite = 10) {
  const vistos = new Set<string>();
  return rows.filter((u) => {
    if (!u.user_id || vistos.has(u.user_id)) return false;
    vistos.add(u.user_id);
    return true;
  }).slice(0, limite);
}

async function buscarUsuarioPorId(client: any, id: string): Promise<UsuarioFeed | null> {
  const { data: postAutor } = await client
    .from("feed_posts")
    .select("user_id, autor_nome, autor_avatar, autor_email, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (postAutor) return postAutor as UsuarioFeed;

  const admin = criarAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data?.user) return null;
  return usuarioAuthParaBusca(data.user);
}

async function contarSeguidores(client: any, id: string) {
  const [{ count: seguidores }, { count: seguindo }, totalPosts] = await Promise.all([
    client.from("follows").select("id", { count: "exact", head: true }).eq("following_id", id),
    client.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", id),
    client.from("feed_posts").select("id", { count: "exact", head: true }).eq("user_id", id),
  ]);
  return { seguidores: seguidores ?? 0, seguindo: seguindo ?? 0, total_posts: totalPosts.count ?? 0 };
}

async function viewerSegue(client: any, viewerId: string, id: string) {
  if (!viewerId || !isUuid(viewerId)) return false;
  const { count } = await client
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", viewerId)
    .eq("following_id", id);
  return (count ?? 0) > 0;
}

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  return res;
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const admin = criarAdminClient();
  const readClient = admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const id = url.searchParams.get("id");
  const viewer_id = url.searchParams.get("viewer_id") || user?.id || "";
  const sugestoes = url.searchParams.get("sugestoes") === "1";

  if (id) {
    if (!isUuid(id)) return json({ error: "Usuario inválido." }, { status: 400 });
    const perfil = await buscarUsuarioPorId(readClient, id);
    if (!perfil) return json({ error: "Usuario nao encontrado." }, { status: 404 });

    const [contagens, segue] = await Promise.all([contarSeguidores(readClient, id), viewerSegue(readClient, viewer_id, id)]);
    return json({ usuario: { id: perfil.user_id, nome: perfil.autor_nome, avatar: perfil.autor_avatar, email: perfil.autor_email, ...contagens, viewer_segue: segue } });
  }

  if (sugestoes) {
    const { data } = await supabase.from("feed_posts").select("user_id, autor_nome, autor_avatar, autor_email, created_at").order("created_at", { ascending: false }).limit(120);
    let usuarios = deduplicarUsuarios((data || []) as UsuarioFeed[], 30);

    if (admin && usuarios.length < 10) {
      const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      usuarios = deduplicarUsuarios([...usuarios, ...(authUsers?.users || []).map(usuarioAuthParaBusca)], 30);
    }

    if (user) {
      usuarios = usuarios.filter((u) => u.user_id !== user.id);
      const ids = usuarios.map((u) => u.user_id);
      if (ids.length > 0) {
        const { data: jaSegue } = await readClient.from("follows").select("following_id").eq("follower_id", user.id).in("following_id", ids);
        const seguindo = new Set((jaSegue || []).map((f: { following_id: string }) => f.following_id));
        usuarios = usuarios.filter((u) => !seguindo.has(u.user_id));
      }
    }

    return json({ usuarios: usuarios.slice(0, 5) });
  }

  if (q && q.trim().length >= 2) {
    const termoOriginal = q.trim();
    const termo = termoOriginal.toLowerCase();
    const { data } = await supabase
      .from("feed_posts")
      .select("user_id, autor_nome, autor_avatar, autor_email, created_at")
      .or(`autor_nome.ilike.%${termoOriginal}%,autor_email.ilike.%${termoOriginal}%`)
      .order("created_at", { ascending: false })
      .limit(80);

    let usuarios = deduplicarUsuarios((data || []) as UsuarioFeed[], 20);
    if (admin) {
      const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
      const extras = (authUsers?.users || []).map(usuarioAuthParaBusca).filter((u) => {
        const nome = (u.autor_nome || "").toLowerCase();
        const email = (u.autor_email || "").toLowerCase();
        return nome.includes(termo) || email.includes(termo);
      });
      usuarios = deduplicarUsuarios([...usuarios, ...extras], 20);
    }

    return json({ usuarios: usuarios.filter(u => u.user_id !== user?.id).slice(0, 20) });
  }

  return json({ usuarios: [] });
}
