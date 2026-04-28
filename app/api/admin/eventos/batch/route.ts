import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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

function normalizar(v: string): string {
  return (v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chave(e: { nome: string; cidade: string; estado: string; data_evento: string }): string {
  return `${normalizar(e.nome)}|${normalizar(e.cidade)}|${e.estado.toUpperCase()}|${e.data_evento}`;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabaseAuth = await createServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { data: adminRow } = await supabaseAuth
    .from("admins")
    .select("email")
    .eq("email", user.email?.toLowerCase() ?? "")
    .single();

  if (!adminRow) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : supabaseAuth;

  const body = await request.json() as { eventos: EventoInput[] };
  const eventos = body.eventos;

  if (!Array.isArray(eventos) || eventos.length === 0) {
    return NextResponse.json({ error: "Nenhum evento enviado." }, { status: 400 });
  }

  const payload = eventos
    .filter(e => e.nome && e.cidade && e.estado && e.data_evento)
    .map(e => ({
      nome: e.nome.trim(),
      cidade: e.cidade.trim(),
      estado: e.estado.trim().toUpperCase(),
      data_evento: e.data_evento.trim(),
      distancia: e.distancia?.trim() || null,
      local: e.local?.trim() || null,
      link_inscricao: e.link_inscricao?.trim() || null,
      destaque: e.destaque ?? false,
    }));

  if (payload.length === 0) {
    return NextResponse.json({ error: "Nenhum evento válido." }, { status: 400 });
  }

  // Buscar eventos existentes com as mesmas datas para deduplicar no servidor
  const datas = [...new Set(payload.map(e => e.data_evento))];
  const { data: existentes } = await supabase
    .from("eventos")
    .select("nome, cidade, estado, data_evento")
    .in("data_evento", datas);

  const chavesExistentes = new Set((existentes || []).map(chave));

  const novos = payload.filter(e => !chavesExistentes.has(chave(e)));

  if (novos.length === 0) {
    return NextResponse.json({ success: true, importados: 0, ignorados: payload.length });
  }

  const { data, error } = await supabase
    .from("eventos")
    .insert(novos)
    .select("id");

  if (error) {
    console.error("[batch/eventos] erro:", error.message, error.details);
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    importados: data?.length ?? novos.length,
    ignorados: payload.length - novos.length,
  });
}
