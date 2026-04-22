import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Você precisa estar logado para criar um treino." }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo, cidade, estado, data_encontro, horario, local_saida,
      percurso, distancia, ritmo, observacoes, organizador_nome,
      tipo_treino, km_planejado, ponto_encontro_lat, ponto_encontro_lng, rota_coords,
    } = body;

    if (!titulo || !cidade || !estado || !data_encontro || !horario || !local_saida) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios: título, cidade, estado, data, horário e ponto de encontro." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("encontros")
      .insert([{
        titulo, cidade, estado, data_encontro, horario, local_saida,
        percurso: percurso || null, distancia: distancia || null,
        ritmo: ritmo || null, observacoes: observacoes || null,
        organizador_nome: organizador_nome || null,
        tipo_treino: tipo_treino || null,
        km_planejado: km_planejado ? Number(km_planejado) : null,
        ponto_encontro_lat, ponto_encontro_lng, rota_coords,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "Erro interno ao criar treino." }, { status: 500 });
  }
}
