import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { participante_id, nome } = await request.json() as { participante_id: number; nome: string };
    if (!participante_id || !nome) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    // Verify the name matches before deleting
    const { data: participante } = await supabase
      .from("encontro_participantes")
      .select("id, nome")
      .eq("id", participante_id)
      .single();

    if (!participante) return NextResponse.json({ error: "Participação não encontrada." }, { status: 404 });
    if (participante.nome.toLowerCase().trim() !== nome.toLowerCase().trim()) {
      return NextResponse.json({ error: "Nome não confere." }, { status: 403 });
    }

    const { error } = await supabase.from("encontro_participantes").delete().eq("id", participante_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
