import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function verificarAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
  return data ? user : null;
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("produtos").select("*").order("ordem").order("criado_em", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const { nome, descricao, preco, preco_promocional, categoria, fotos, cores, tamanhos, estoque_disponivel, destaque, whatsapp_msg, ordem } = body;
  if (!nome || !preco || !categoria) return NextResponse.json({ error: "Nome, preço e categoria são obrigatórios." }, { status: 400 });
  const { data, error } = await supabase.from("produtos").insert([{ nome, descricao: descricao || null, preco: Number(preco), preco_promocional: preco_promocional ? Number(preco_promocional) : null, categoria, fotos: fotos || [], cores: cores || [], tamanhos: tamanhos || [], estoque_disponivel: estoque_disponivel ?? true, destaque: destaque || false, whatsapp_msg: whatsapp_msg || null, ordem: ordem || 0 }]).select().single();
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
  const update: Record<string, unknown> = {};
  const fields = ["nome","descricao","preco","preco_promocional","categoria","fotos","cores","tamanhos","estoque_disponivel","destaque","whatsapp_msg","ordem"];
  for (const f of fields) if (campos[f] !== undefined) update[f] = campos[f];
  if (update.preco) update.preco = Number(update.preco);
  if (update.preco_promocional) update.preco_promocional = update.preco_promocional ? Number(update.preco_promocional) : null;
  const { data, error } = await supabase.from("produtos").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id } = await request.json() as { id: string };
  if (!id) return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
