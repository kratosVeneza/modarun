import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const tipo = body.tipo as string;
    const texto = body.texto as string | null;
    const fotos = body.fotos as string[] | undefined;

    if (!tipo || !["post", "atividade"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    if (!texto && (!fotos || fotos.length === 0) && tipo !== "atividade") {
      return NextResponse.json({ error: "Post precisa de texto ou foto." }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      user_id: user.id,
      tipo,
      texto: texto?.trim() ?? null,
      fotos: fotos ?? [],
    };

    if (tipo === "atividade") {
      payload.atividade_distancia = body.atividade_distancia ?? null;
      payload.atividade_tempo = (body.atividade_tempo as string | undefined)?.trim() ?? null;
      payload.atividade_pace = (body.atividade_pace as string | undefined)?.trim() ?? null;
      payload.atividade_tipo = (body.atividade_tipo as string | undefined)?.trim() ?? "Corrida";
    }

    const { data, error } = await supabase
      .from("feed_posts")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "0");
    const limite = 15;

    const { data, error } = await supabase
      .from("feed_posts_view")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * limite, (page + 1) * limite - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      posts: data ?? [],
      pagina: page,
      tem_mais: (data?.length ?? 0) === limite,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id obrigatório." }, { status: 400 });
    }

    await supabase.from("feed_posts").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
