import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { encontroId } = await request.json();

    if (!encontroId) {
      return NextResponse.json({ error: "ID do treino não informado." }, { status: 400 });
    }

    // Busca o treino
    const { data: encontro, error: fetchError } = await supabase
      .from("encontros")
      .select("id, user_id, titulo")
      .eq("id", encontroId)
      .single();

    if (fetchError || !encontro) {
      return NextResponse.json({ error: "Treino não encontrado." }, { status: 404 });
    }

    // Verifica se é admin pela tabela admins
    const { data: adminRow } = await supabase
      .from("admins")
      .select("email")
      .eq("email", user.email?.toLowerCase() ?? "")
      .single();

    const isAdmin = !!adminRow;

    // user_id null = treino antigo, qualquer logado pode excluir
    const isDono = encontro.user_id === user.id || encontro.user_id === null;

    if (!isDono && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este treino." },
        { status: 403 }
      );
    }

    // Deleta participantes primeiro
    await supabase
      .from("encontro_participantes")
      .delete()
      .eq("encontro_id", encontroId);

    // Deleta o treino
    const { error: deleteError } = await supabase
      .from("encontros")
      .delete()
      .eq("id", encontroId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erro ao excluir treino:", e);
    return NextResponse.json({ error: "Erro interno ao excluir treino." }, { status: 500 });
  }
}
