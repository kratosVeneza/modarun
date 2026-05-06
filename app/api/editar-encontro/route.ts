import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type CamposEdicao = Record<string, unknown>;

function textoOuNull(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo || null;
}

function temCampo(campos: CamposEdicao, chave: string): boolean {
  return Object.prototype.hasOwnProperty.call(campos, chave);
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json() as CamposEdicao;
    const { encontroId, ...campos } = body;

    if (!encontroId) {
      return NextResponse.json({ error: "ID não informado." }, { status: 400 });
    }

    const { data: encontro } = await supabase
      .from("encontros")
      .select("id, user_id")
      .eq("id", encontroId)
      .single();

    if (!encontro) {
      return NextResponse.json({ error: "Treino não encontrado." }, { status: 404 });
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("email")
      .eq("email", user.email?.toLowerCase() ?? "")
      .single();

    const isAdmin = !!adminRow;
    const isDono = encontro.user_id === user.id || encontro.user_id === null;

    if (!isDono && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    for (const chave of ["titulo", "cidade", "estado", "data_encontro", "horario", "local_saida"] as const) {
      if (temCampo(campos, chave) && typeof campos[chave] === "string") {
        updateData[chave] = String(campos[chave]).trim();
      }
    }

    for (const chave of ["tipo_treino", "ritmo", "percurso", "observacoes", "organizador_nome", "distancia"] as const) {
      if (temCampo(campos, chave)) updateData[chave] = textoOuNull(campos[chave]);
    }

    if (temCampo(campos, "km_planejado")) {
      const valor = campos.km_planejado;
      updateData.km_planejado = valor === null || valor === "" ? null : Number(valor);
    }


    if (temCampo(campos, "ponto_encontro_lat")) {
      const valor = campos.ponto_encontro_lat;
      updateData.ponto_encontro_lat = valor === null || valor === "" ? null : Number(valor);
    }

    if (temCampo(campos, "ponto_encontro_lng")) {
      const valor = campos.ponto_encontro_lng;
      updateData.ponto_encontro_lng = valor === null || valor === "" ? null : Number(valor);
    }

    if (temCampo(campos, "rota_coords")) {
      updateData.rota_coords = Array.isArray(campos.rota_coords) ? campos.rota_coords : [];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualizar." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("encontros")
      .update(updateData)
      .eq("id", encontroId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
