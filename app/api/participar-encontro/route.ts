import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const WHATSAPP_ORGANIZADOR = process.env.WHATSAPP_ORGANIZADOR || "5594920009526";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as { encontro_id: number; nome: string; whatsapp?: string };
    const { encontro_id, nome, whatsapp } = body;
    if (!encontro_id || !nome) return NextResponse.json({ error: "Encontro e nome são obrigatórios." }, { status: 400 });

    const { data, error } = await supabase.from("encontro_participantes").insert([{ encontro_id, nome, whatsapp }]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: treino } = await supabase.from("encontros").select("titulo, data_encontro, horario, local_saida, cidade").eq("id", encontro_id).single();
    let whatsappLink: string | null = null;
    if (treino) {
      const dataFormatada = treino.data_encontro ? String(treino.data_encontro).split("-").reverse().join("/") : "";
      const msg = encodeURIComponent(`🏃 Nova confirmação de presença!\n\nTreino: *${treino.titulo}*\nParticipante: *${nome}*${whatsapp ? `\nWhatsApp: ${whatsapp}` : ""}\n\n📅 ${dataFormatada} às ${treino.horario || ""}\n📍 ${treino.local_saida || ""} — ${treino.cidade || ""}`);
      whatsappLink = `https://wa.me/${WHATSAPP_ORGANIZADOR}?text=${msg}`;
    }

    return NextResponse.json({ success: true, data, whatsappLink });
  } catch { return NextResponse.json({ error: "Erro interno." }, { status: 500 }); }
}
