import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function verificarAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email?.toLowerCase() ?? "")
    .single();

  return data ? user : null;
}

function normalizarTexto(valor: string): string {
  return (valor || "")
    .replace(/�/g, "")
    .replace(/ª/g, "a")
    .replace(/º/g, "o")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function criarChaveEvento(evento: {
  nome: string;
  cidade: string;
  estado: string;
  data_evento: string;
}): string {
  return [
    normalizarTexto(evento.nome),
    normalizarTexto(evento.cidade),
    normalizarTexto(evento.estado).toUpperCase(),
    evento.data_evento,
  ].join("|");
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const nome = String(body.nome || "").trim();
  const cidade = String(body.cidade || "").trim();
  const estado = String(body.estado || "").trim().toUpperCase();
  const data_evento = String(body.data_evento || "").trim();
  const distancia = String(body.distancia || "").trim();
  const local = String(body.local || "").trim();
  const link_inscricao = String(body.link_inscricao || "").trim();
  const destaque =
    body.destaque === true ||
    body.destaque === "true" ||
    String(body.destaque) === "true";

  if (!nome || !cidade || !estado || !data_evento) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando." },
      { status: 400 }
    );
  }

  const chave_evento = criarChaveEvento({
    nome,
    cidade,
    estado,
    data_evento,
  });

  const { data, error } = await supabase
    .from("eventos")
    .upsert(
      {
        nome,
        cidade,
        estado,
        data_evento,
        distancia: distancia || null,
        local: local || null,
        link_inscricao: link_inscricao || null,
        destaque,
        chave_evento,
      },
      {
        onConflict: "chave_evento",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const id = Number(body.id);
  const nome = String(body.nome || "").trim();
  const cidade = String(body.cidade || "").trim();
  const estado = String(body.estado || "").trim().toUpperCase();
  const data_evento = String(body.data_evento || "").trim();
  const distancia = String(body.distancia || "").trim();
  const local = String(body.local || "").trim();
  const link_inscricao = String(body.link_inscricao || "").trim();
  const destaque =
    body.destaque === true ||
    body.destaque === "true" ||
    String(body.destaque) === "true";

  if (!id) {
    return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  }

  if (!nome || !cidade || !estado || !data_evento) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando." },
      { status: 400 }
    );
  }

  const chave_evento = criarChaveEvento({
    nome,
    cidade,
    estado,
    data_evento,
  });

  const updateData = {
    nome,
    cidade,
    estado,
    data_evento,
    distancia: distancia || null,
    local: local || null,
    link_inscricao: link_inscricao || null,
    destaque,
    chave_evento,
  };

  const { data, error } = await supabase
    .from("eventos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await verificarAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = (await request.json()) as { id: number };

  if (!id) {
    return NextResponse.json({ error: "ID não informado." }, { status: 400 });
  }

  const { error } = await supabase.from("eventos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}