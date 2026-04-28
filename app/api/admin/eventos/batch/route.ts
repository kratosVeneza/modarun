import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type EventoInput = {
  nome: string;
  cidade: string;
  estado: string;
  data_evento: string;
  distancia?: string | null;
  local?: string | null;
  link_inscricao?: string | null;
  destaque?: boolean;
};

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();

  // Verificar autenticação e admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email?.toLowerCase() ?? "")
    .single();

  if (!adminRow) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json() as { eventos: EventoInput[] };
  const eventos = body.eventos;

  if (!Array.isArray(eventos) || eventos.length === 0) {
    return NextResponse.json({ error: "Nenhum evento enviado." }, { status: 400 });
  }

  // Validar campos obrigatórios
  const invalidos = eventos.filter(e => !e.nome || !e.cidade || !e.estado || !e.data_evento);
  if (invalidos.length > 0) {
    return NextResponse.json(
      { error: `${invalidos.length} evento(s) sem campos obrigatórios.` },
      { status: 400 }
    );
  }

  const payload = eventos.map(e => ({
    nome: e.nome.trim(),
    cidade: e.cidade.trim(),
    estado: e.estado.trim().toUpperCase(),
    data_evento: e.data_evento.trim(),
    distancia: e.distancia?.trim() || null,
    local: e.local?.trim() || null,
    link_inscricao: e.link_inscricao?.trim() || null,
    destaque: e.destaque ?? false,
  }));

  const { data, error } = await supabase
    .from("eventos")
    .insert(payload)
    .select();

  if (error) {
    console.error("[batch/eventos] erro insert:", error.message, error.details);
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    importados: data?.length ?? payload.length,
  });
}
