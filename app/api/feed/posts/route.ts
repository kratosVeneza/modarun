import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
  const autor_nome = String(meta?.full_name ?? user.email?.split("@")[0] ?? "Corredor");
  const autor_avatar = (meta?.avatar_url as string | undefined) ?? null;
  const autor_email = user.email ?? null;

  const payload: Record<string, unknown> = {
    user_id: user.id,
    tipo,
    texto,
    fotos,
    autor_nome,
    autor_avatar,
    autor_email,
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
  return NextResponse.json({ success: true, post: data });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const page = parseInt(new URL(req.url).searchParams.get("page") ?? "0");
  const limite = 15;

  const { data, error } = await supabase
    .from("feed_posts_view")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * limite, (page + 1) * limite - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [], pagina: page, tem_mais: (data?.length ?? 0) === limite });
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
