import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const post_id = Number(b.post_id);
  const texto = String(b.texto ?? "").trim();
  if (!texto) return NextResponse.json({ error: "Comentario vazio." }, { status: 400 });

  const meta = user.user_metadata as Record<string, unknown>;
  const autor_nome = String(meta?.full_name ?? user.email?.split("@")[0] ?? "Corredor");
  const autor_avatar = (meta?.avatar_url as string | undefined) ?? null;

  const { data, error } = await supabase
    .from("feed_comentarios")
    .insert({ post_id, user_id: user.id, texto, autor_nome, autor_avatar })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase
    .from("feed_comentarios")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post_id);

  await supabase.from("feed_posts").update({ total_comentarios: count ?? 0 }).eq("id", post_id);

  return NextResponse.json({ success: true, comentario: { ...data, autor_nome, autor_avatar } });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const post_id = new URL(req.url).searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id obrigatorio." }, { status: 400 });

  const { data, error } = await supabase
    .from("feed_comentarios")
    .select("id, texto, created_at, autor_nome, autor_avatar")
    .eq("post_id", post_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comentarios: data ?? [] });
}
