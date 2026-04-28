import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(): Promise<NextResponse> {
  const resultado: Record<string, unknown> = {};

  try {
    const supabase = await createClient();

    // 1. Verificar sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    resultado.auth = {
      ok: !!user,
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      erro: authError?.message ?? null,
    };

    if (!user) {
      return NextResponse.json({ ...resultado, bloqueio: "SEM_SESSAO" });
    }

    // 2. Verificar se é admin
    const { data: adminRow, error: adminErr } = await supabase
      .from("admins")
      .select("email")
      .eq("email", user.email?.toLowerCase() ?? "")
      .single();

    resultado.admin = {
      ok: !!adminRow,
      erro: adminErr?.message ?? null,
    };

    if (!adminRow) {
      return NextResponse.json({ ...resultado, bloqueio: "NAO_ADMIN" });
    }

    // 3. Testar SELECT na tabela eventos
    const { data: selectData, error: selectErr } = await supabase
      .from("eventos")
      .select("id")
      .limit(1);

    resultado.select_eventos = {
      ok: !selectErr,
      count: selectData?.length ?? 0,
      erro: selectErr?.message ?? null,
    };

    // 4. Testar INSERT com evento fictício e depois deletar
    const eventoTeste = {
      nome: "__TESTE_DIAGNOSTICO__",
      cidade: "Teste",
      estado: "PA",
      data_evento: "2099-01-01",
      destaque: false,
    };

    const { data: insertData, error: insertErr } = await supabase
      .from("eventos")
      .insert(eventoTeste)
      .select()
      .single();

    resultado.insert_eventos = {
      ok: !insertErr,
      id_inserido: insertData?.id ?? null,
      erro: insertErr?.message ?? null,
      detalhes: insertErr?.details ?? null,
      hint: insertErr?.hint ?? null,
      code: (insertErr as unknown as { code?: string })?.code ?? null,
    };

    // 5. Limpar o teste se inseriu
    if (insertData?.id) {
      await supabase.from("eventos").delete().eq("id", insertData.id);
      resultado.cleanup = "ok";
    }

    const bloqueio = insertErr ? "INSERT_BLOQUEADO" : "NENHUM";
    return NextResponse.json({ ...resultado, bloqueio });

  } catch (e) {
    return NextResponse.json({
      ...resultado,
      bloqueio: "EXCECAO",
      excecao: String(e),
    });
  }
}
