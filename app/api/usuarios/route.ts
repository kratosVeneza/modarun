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
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function usuarioAuthParaBusca(u: any): UsuarioFeed {
  const nomeMeta = u.user_metadata?.name || u.user_metadata?.full_name || u.user_metadata?.nome || u.user_metadata?.autor_nome;
  const avatarMeta = u.user_metadata?.avatar_url || u.user_metadata?.picture || null;
  return {
    user_id: u.id,
    autor_nome: nomeMeta || u.email?.split("@")[0] || "Corredor",
    autor_avatar: avatarMeta,
    autor_email: u.email || null,
    created_at: u.created_at,
  };
}

function deduplicarUsuarios(rows: UsuarioFeed[], limite = 10) {
  const vistos = new Set<string>();
  return rows.filter((u) => {
    if (!u.user_id || vistos.has(u.user_id)) return false;
    vistos.add(u.user_id);
    return true;
  }).slice(0, limite);
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const id = url.searchParams.get("id");
  const viewer_id = url.searchParams.get("viewer_id") || user?.id || "";
  const sugestoes = url.searchParams.get("sugestoes") === "1";

  if (id) {
    const { data: posts } = await supabase
      .from("feed_posts")
      .select("user_id, autor_nome, autor_avatar, autor_email")
      .eq("user_id", id)
      .limit(1)
      .maybeSingle();

    if (!posts) return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });

    const [{ count: seguidores }, { count: seguindo }, follow, totalPosts] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      viewer_id
        ? supabase.from("follows").select("id").eq("follower_id", viewer_id).eq("following_id", id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("feed_posts").select("*", { count: "exact", head: true }).eq("user_id", id),
    ]);

    return NextResponse.json({
      usuario: {
        id: posts.user_id,
        nome: posts.autor_nome,
        avatar: posts.autor_avatar,
        email: posts.autor_email,
        seguidores: seguidores ?? 0,
        seguindo: seguindo ?? 0,
        total_posts: totalPosts.count ?? 0,
        viewer_segue: !!(follow as { data: unknown }).data,
      }
    });
  }

  if (sugestoes) {
    const { data } = await supabase
      .from("feed_posts")
      .select("user_id, autor_nome, autor_avatar, autor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(120);

    let usuarios = deduplicarUsuarios((data || []) as UsuarioFeed[], 30);

    if (user) {
      usuarios = usuarios.filter((u) => u.user_id !== user.id);

      const ids = usuarios.map((u) => u.user_id);
      if (ids.length > 0) {
        const { data: jaSegue } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", ids);

        const seguindo = new Set((jaSegue || []).map((f: { following_id: string }) => f.following_id));
        usuarios = usuarios.filter((u) => !seguindo.has(u.user_id));
      }
    }

    return NextResponse.json({ usuarios: usuarios.slice(0, 5) });
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

    if (usuarios.length < 10) {
      const admin = criarAdminClient();
      if (admin) {
        const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const extras = (authUsers?.users || [])
          .map(usuarioAuthParaBusca)
          .filter((u) => {
            const nome = (u.autor_nome || "").toLowerCase();
            const email = (u.autor_email || "").toLowerCase();
            return nome.includes(termo) || email.includes(termo);
          });
        usuarios = deduplicarUsuarios([...usuarios, ...extras], 20);
      }
    }

    return NextResponse.json({ usuarios: usuarios.filter(u => u.user_id !== user?.id).slice(0, 20) });
  }

  return NextResponse.json({ usuarios: [] });
}
