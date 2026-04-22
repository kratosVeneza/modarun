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
  const { nome, cidade, estado, data_evento, distancia, local, link_inscricao, destaque } = body as Record<string, string | boolean>;
  if (!nome || !cidade || !estado || !data_evento) return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  const { data, error } = await supabase.from("eventos").insert([{ nome, cidade, estado, data_evento, distancia: distancia || null, local: local || null, link_inscricao: link_inscricao || null, destaque: destaque || false }]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const { id, nome, cidade, estado, data_evento, distancia, local, link_inscricao, destaque } = body as Record<string, string | boolean | number>;
  if (!id) return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  const { data, error } = await supabase.from("eventos").update({ nome, cidade, estado, data_evento, distancia: distancia || null, local: local || null, link_inscricao: link_inscricao || null, destaque: destaque || false }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id } = await request.json() as { id: number };
  if (!id) return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
