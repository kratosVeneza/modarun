import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function verificarAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
  return data ? user : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const { titulo, subtitulo, imagem_url, link_url, link_texto, ativo, ordem, position_x, position_y } = body;
  if (!imagem_url) return NextResponse.json({ error: "Imagem é obrigatória." }, { status: 400 });

  // Tenta inserir com position_x/y, se falhar tenta sem
  let insertData: Record<string, unknown> = {
    titulo: titulo || null, subtitulo: subtitulo || null, imagem_url,
    link_url: link_url || null, link_texto: link_texto || "Ver mais",
    ativo: ativo ?? true, ordem: ordem || 0,
    position_x: position_x ?? 50, position_y: position_y ?? 50,
  };

  let { data, error } = await supabase.from("banners").insert([insertData]).select().single();

  // Se deu erro com position_x/y (colunas podem não existir), tenta sem
  if (error && error.message.includes("position_")) {
    const { position_x: _px, position_y: _py, ...semPosition } = insertData;
    const result2 = await supabase.from("banners").insert([semPosition]).select().single();
    data = result2.data; error = result2.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const { id, ...campos } = body;
  if (!id) return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  const { data, error } = await supabase.from("banners").update(campos).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id } = await request.json() as { id: string };
  if (!id) return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
