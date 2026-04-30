import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const outro_id = url.searchParams.get("outro_id");

  if (outro_id) {
    // Buscar mensagens de uma conversa específica
    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${outro_id}),and(remetente_id.eq.${outro_id},destinatario_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(100);

    // Marcar como lidas
    await supabase.from("mensagens")
      .update({ lida: true })
      .eq("destinatario_id", user.id)
      .eq("remetente_id", outro_id)
      .eq("lida", false);

    return NextResponse.json({ mensagens: data || [] });
  }

  // Buscar lista de conversas (última mensagem de cada)
  const { data: todas } = await supabase
    .from("mensagens")
    .select("*")
    .or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);

  // Agrupar por conversa
  type MsgRow = { id: number; remetente_id: string; destinatario_id: string; texto: string; lida: boolean; created_at: string };
  const conversas: Record<string, MsgRow> = {};
  (todas || []).forEach((m: MsgRow) => {
    const outro = m.remetente_id === user.id ? m.destinatario_id : m.remetente_id;
    if (!conversas[outro]) conversas[outro] = m;
  });

  return NextResponse.json({ conversas: Object.values(conversas) });
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const texto = String(b.texto ?? "").trim();
  const destinatario_id = String(b.destinatario_id ?? "");

  if (!texto || !destinatario_id) {
    return NextResponse.json({ error: "texto e destinatario_id obrigatorios" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("mensagens")
    .insert({ remetente_id: user.id, destinatario_id, texto })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, mensagem: data });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

  await supabase.from("mensagens").delete().eq("id", id).eq("remetente_id", user.id);
  return NextResponse.json({ success: true });
}
