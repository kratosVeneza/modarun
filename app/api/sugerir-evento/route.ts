import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, string>;
    const { nome, cidade, estado, data_evento, distancia, local, link_inscricao, organizador_nome, organizador_whatsapp } = body;
    if (!nome || !cidade || !estado || !data_evento) {
      return NextResponse.json({ error: "Nome, cidade, estado e data são obrigatórios." }, { status: 400 });
    }
    const { error } = await supabase.from("sugestoes_eventos").insert([{
      nome, cidade, estado, data_evento,
      distancia: distancia || null, local: local || null,
      link_inscricao: link_inscricao || null,
      organizador_nome: organizador_nome || null,
      organizador_whatsapp: organizador_whatsapp || null,
      status: "pendente",
    }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
