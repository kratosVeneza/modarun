import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as { encontro_id: number; nome: string; whatsapp?: string };
    const { encontro_id, nome, whatsapp } = body;
    if (!encontro_id || !nome) return NextResponse.json({ error: "Encontro e nome são obrigatórios." }, { status: 400 });

    // Verificar duplicidade por WhatsApp (se informado) ou por nome
    if (whatsapp?.trim()) {
      const { data: existentePorWhatsapp } = await supabase
        .from("encontro_participantes")
        .select("id, nome")
        .eq("encontro_id", encontro_id)
        .eq("whatsapp", whatsapp.trim())
        .single();
      if (existentePorWhatsapp) {
        return NextResponse.json({ error: `Este WhatsApp já está confirmado neste treino (${existentePorWhatsapp.nome}).` }, { status: 409 });
      }
    } else {
      // Sem WhatsApp: verifica nome + avisa que pode haver homônimos
      const { data: existentePorNome } = await supabase
        .from("encontro_participantes")
        .select("id")
        .eq("encontro_id", encontro_id)
        .ilike("nome", nome.trim())
        .single();
      if (existentePorNome) {
        return NextResponse.json({ error: `"${nome}" já está na lista. Se você é outra pessoa com o mesmo nome, informe seu WhatsApp para diferenciar.` }, { status: 409 });
      }
    }

    const { data, error } = await supabase.from("encontro_participantes").insert([{ encontro_id, nome, whatsapp }]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ error: "Erro interno." }, { status: 500 }); }
}
