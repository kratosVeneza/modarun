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
      const { data: existentePorWhatsapp } = await supabase
        .from("encontro_participantes")
        .select("id, nome")
        .eq("encontro_id", encontro_id)
        .eq("whatsapp", whatsapp.trim())
        .single();

      if (existentePorWhatsapp) {
        return NextResponse.json({
          error: `Este WhatsApp já está confirmado neste treino (${existentePorWhatsapp.nome}).`,
        }, { status: 409 });
      }
    } else {
      const { data: existentePorNome } = await supabase
        .from("encontro_participantes")
        .select("id")
        .eq("encontro_id", encontro_id)
        .ilike("nome", nome.trim())
        .single();

      if (existentePorNome) {
        return NextResponse.json({
          error: `"${nome}" já está na lista. Se você é outra pessoa com o mesmo nome, informe seu WhatsApp para diferenciar.`,
        }, { status: 409 });
      }
    }

    // Inserir participante
    const { data, error } = await supabase
      .from("encontro_participantes")
      .insert([{ encontro_id, nome, whatsapp }])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Buscar dados do treino para notificar o organizador
    const { data: treino } = await supabase
      .from("encontros")
      .select("titulo, cidade, estado, data_encontro, horario, whatsapp_organizador, organizador_nome")
      .eq("id", encontro_id)
      .single();

    // Montar link de notificação WhatsApp para o organizador
    let whatsappNotificacaoUrl: string | null = null;

    if (treino?.whatsapp_organizador) {
      const participantesCount = await supabase
        .from("encontro_participantes")
        .select("id", { count: "exact" })
        .eq("encontro_id", encontro_id);

      const total = participantesCount.count || 1;
      const linkTreino = `${SITE_URL}/treinos/${encontro_id}/publico`;

      const msg = [
        `🏃 *Nova confirmação no seu treino!*`,
        ``,
        `👤 *${nome}* confirmou presença${whatsapp ? ` (WhatsApp: ${whatsapp})` : ""}`,
        `📋 *${treino.titulo}*`,
        `📍 ${treino.cidade}/${treino.estado}`,
        `👥 Total: ${total} participante${total !== 1 ? "s" : ""}`,
        ``,
        `👉 Ver treino: ${linkTreino}`,
      ].join("\n");

      const numeroLimpo = treino.whatsapp_organizador.replace(/\D/g, "");
      whatsappNotificacaoUrl = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(msg)}`;
    }

    return NextResponse.json({
      success: true,
      data,
      // Retorna o link de notificação para o frontend abrir
      whatsapp_organizador_url: whatsappNotificacaoUrl,
    });

  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
