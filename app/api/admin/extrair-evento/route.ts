import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
    if (!adminRow) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const { texto } = await request.json() as { texto: string };
    if (!texto?.trim()) return NextResponse.json({ error: "Texto vazio." }, { status: 400 });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Extraia as informações de evento de corrida do texto abaixo e retorne APENAS um JSON válido, sem markdown, sem explicações.

Campos: nome, cidade, estado (sigla 2 letras), data_evento (formato YYYY-MM-DD), distancia, local, link_inscricao

Se não encontrar um campo, use null. Se a data estiver no formato DD/MM/AAAA, converta para YYYY-MM-DD.

Texto:
${texto}

Retorne apenas o JSON.`
        }],
      }),
    });

    const result = await response.json();
    const textoResposta = result.content?.[0]?.text || "";

    let evento: Record<string, string | null> = {};
    try {
      const clean = textoResposta.replace(/```json|```/g, "").trim();
      evento = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "Não foi possível extrair as informações. Tente um texto mais completo." }, { status: 400 });
    }

    return NextResponse.json({ success: true, evento });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
