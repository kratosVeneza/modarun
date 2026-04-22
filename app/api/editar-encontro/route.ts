import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
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

    const { data, error } = await supabase
      .from("encontros")
      .update({
        titulo: campos.titulo as string,
        cidade: campos.cidade as string,
        estado: campos.estado as string,
        data_encontro: campos.data_encontro as string,
        horario: campos.horario as string,
        local_saida: campos.local_saida as string,
        tipo_treino: (campos.tipo_treino as string) || null,
        km_planejado: campos.km_planejado ? Number(campos.km_planejado) : null,
        ritmo: (campos.ritmo as string) || null,
        percurso: (campos.percurso as string) || null,
        observacoes: (campos.observacoes as string) || null,
        organizador_nome: (campos.organizador_nome as string) || null,
      })
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
