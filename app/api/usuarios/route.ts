import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const id = url.searchParams.get("id");
  const viewer_id = url.searchParams.get("viewer_id");

  // Buscar perfil por ID
  if (id) {
    const { data: posts } = await supabase
      .from("feed_posts")
      .select("user_id, autor_nome, autor_avatar, autor_email")
      .eq("user_id", id)
      .limit(1)
      .single();

    if (!posts) return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });

    const [{ count: seguidores }, { count: seguindo }, follow] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      viewer_id
        ? supabase.from("follows").select("id").eq("follower_id", viewer_id).eq("following_id", id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const { data: totalPosts } = await supabase
      .from("feed_posts")
      .select("*", { count: "exact", head: true } as { count: "exact"; head: true })
      .eq("user_id", id);

    return NextResponse.json({
      usuario: {
        id: posts.user_id,
        nome: posts.autor_nome,
        avatar: posts.autor_avatar,
        email: posts.autor_email,
        seguidores: seguidores ?? 0,
        seguindo: seguindo ?? 0,
        total_posts: (totalPosts as unknown as { count: number })?.count ?? 0,
        viewer_segue: !!(follow as { data: unknown }).data,
      }
    });
  }

  // Buscar usuarios por nome
  if (q && q.trim().length >= 2) {
    const termo = q.trim().toLowerCase();
    const { data } = await supabase
      .from("feed_posts")
      .select("user_id, autor_nome, autor_avatar, autor_email")
      .or(`autor_nome.ilike.%${termo}%,autor_email.ilike.%${termo}%`)
      .limit(50);

    // Deduplicar por user_id
    const vistos = new Set<string>();
    const usuarios = (data ?? []).filter(u => {
      if (vistos.has(u.user_id)) return false;
      vistos.add(u.user_id);
      return true;
    }).slice(0, 10);

    return NextResponse.json({ usuarios });
  }

  return NextResponse.json({ usuarios: [] });
}
