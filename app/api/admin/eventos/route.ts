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
  const id = Number(body.id);
  const nome = body.nome as string;
  const cidade = body.cidade as string;
  const estado = body.estado as string;
  const data_evento = body.data_evento as string;
  const distancia = body.distancia as string || null;
  const local = body.local as string || null;
  const link_inscricao = body.link_inscricao as string || null;
  const destaque = body.destaque === true || body.destaque === "true" || String(body.destaque) === "true";
  
  console.log("PATCH eventos - id:", id, "destaque recebido:", body.destaque, "tipo:", typeof body.destaque, "destaque final:", destaque);
  
  if (!id) return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  
  // Update only destaque field explicitly
  const updateData: Record<string, unknown> = { nome, cidade, estado, data_evento, distancia, local, link_inscricao, destaque };
  console.log("updateData.destaque:", updateData.destaque);
  
  const { data, error } = await supabase.from("eventos").update(updateData).eq("id", id).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  console.log("Update result:", data?.[0]?.destaque);
  return NextResponse.json({ success: true, data: data?.[0] || null, debug: { destaque_enviado: body.destaque, destaque_salvo: destaque } });
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
