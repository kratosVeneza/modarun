import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { encontro_id, nome, whatsapp } = body;

    if (!encontro_id || !nome) {
      return NextResponse.json(
        { error: "Encontro e nome são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("encontro_participantes")
      .insert([{ encontro_id, nome, whatsapp }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao participar do encontro." },
      { status: 500 }
    );
  }
}