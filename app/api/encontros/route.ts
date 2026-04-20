import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      titulo,
      cidade,
      estado,
      data_encontro,
      horario,
      local_saida,
      percurso,
      distancia,
      ritmo,
      observacoes,
      organizador_nome,
    } = body;

    if (
      !titulo ||
      !cidade ||
      !estado ||
      !data_encontro ||
      !horario ||
      !local_saida ||
      !distancia
    ) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("encontros")
      .insert([
        {
          titulo,
          cidade,
          estado,
          data_encontro,
          horario,
          local_saida,
          percurso,
          distancia,
          ritmo,
          observacoes,
          organizador_nome,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao criar encontro." },
      { status: 500 }
    );
  }
}