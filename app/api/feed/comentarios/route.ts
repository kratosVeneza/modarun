import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const body = await req.json();
  const post_id = Number(body.post_id);
  const texto = String(body.texto ?? "").trim();
  if (!texto) return NextResponse.json({ error: "Comentario vazio." }, { status: 400 });

  const autor_nome = String(
    (user.user_metadata as Record<string, unknown>)?.full_name ?? 
    user.email?.split("@")[0] ?? 
    "Corredor"
  );

  const { data, error } = await supabase
    .from("feed_comentarios")
    .insert({ post_id, user_id: user.id, texto, autor_nome })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase
    .from("feed_comentarios")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post_id);

  await supabase.from("feed_posts").update({ total_comentarios: count ?? 0 }).eq("id", post_id);

  return NextResponse.json({ success: true, comentario: { ...data, autor_nome } });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const post_id = new URL(req.url).searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id obrigatorio." }, { status: 400 });

  const { data, error } = await supabase
    .from("feed_comentarios")
    .select("id, texto, created_at, autor_nome")
    .eq("post_id", post_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comentarios: data ?? [] });
}
