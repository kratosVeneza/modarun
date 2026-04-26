import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://modarun.com.br";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as { encontro_id: number; nome: string; whatsapp?: string };
    const { encontro_id, nome, whatsapp } = body;

    if (!encontro_id || !nome) {
      return NextResponse.json({ error: "Encontro e nome são obrigatórios." }, { status: 400 });
    }

    // Verificar duplicidade por WhatsApp (prioritário) ou nome
    if (whatsapp?.trim()) {
      const { data: existente } = await supabase
        .from("encontro_participantes")
        .select("id, nome")
        .eq("encontro_id", encontro_id)
        .eq("whatsapp", whatsapp.trim())
        .single();
      if (existente) {
        return NextResponse.json({
          error: `Este WhatsApp já está confirmado neste treino (${existente.nome}).`,
        }, { status: 409 });
      }
    } else {
      const { data: existente } = await supabase
        .from("encontro_participantes")
        .select("id")
        .eq("encontro_id", encontro_id)
        .ilike("nome", nome.trim())
        .single();
      if (existente) {
        return NextResponse.json({
          error: `"${nome}" já está na lista. Se você é outra pessoa com o mesmo nome, informe seu WhatsApp para diferenciar.`,
        }, { status: 409 });
      }
    }

    // Inserir participante
    const { data, error } = await supabase
      .from("encontro_participantes")
      .insert([{ encontro_id, nome, whatsapp: whatsapp?.trim() || null }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Buscar dados do treino para notificar o organizador
    const { data: treino } = await supabase
      .from("encontros")
      .select("titulo, cidade, estado, data_encontro, horario, organizador_whatsapp, organizador_nome")
      .eq("id", encontro_id)
      .single();

    // Contar total de participantes
    const { count } = await supabase
      .from("encontro_participantes")
      .select("id", { count: "exact", head: true })
      .eq("encontro_id", encontro_id);

    const total = count || 1;

    // Montar link de notificação WhatsApp para o organizador
    let whatsappNotificacaoUrl: string | null = null;

    if (treino?.organizador_whatsapp) {
      const linkTreino = `${SITE_URL}/treinos/${encontro_id}/publico`;

      const linhas = [
        `🏃 *Nova confirmação no seu treino!*`,
        ``,
        `👤 *${nome}* confirmou presença${whatsapp ? ` — WhatsApp: ${whatsapp}` : ""}`,
        ``,
        `📋 *${treino.titulo}*`,
        `📍 ${treino.cidade}/${treino.estado}`,
        `📅 ${treino.data_encontro} às ${treino.horario}`,
        `👥 Total agora: *${total} participante${total !== 1 ? "s" : ""}*`,
        ``,
        `👉 Ver lista completa:`,
        linkTreino,
      ];

      const msg = linhas.join("\n");
      const numeroLimpo = treino.organizador_whatsapp.replace(/\D/g, "");
      whatsappNotificacaoUrl = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(msg)}`;
    }

    return NextResponse.json({
      success: true,
      data,
      whatsapp_organizador_url: whatsappNotificacaoUrl,
    });

  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
