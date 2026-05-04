import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Rota de diagnóstico para entender por que notificações não estão aparecendo.
// Acesse /api/notificacoes/diagnostico estando logado para ver:
//  - se a SUPABASE_SERVICE_ROLE_KEY está configurada
//  - se você consegue criar notificação como o usuário logado (RLS)
//  - se a tabela 'notificacoes' tem todas as colunas esperadas
// Em produção pode ser deixada protegida por admin se preferir; aqui é
// pública por padrão para facilitar o debug.

function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login antes de chamar a rota." }, { status: 401 });

  const admin = sbAdmin();
  const tem_service_key = !!admin;

  // Testa SELECT (deveria sempre funcionar com a sessão).
  const { data: existentes, error: erroSelect } = await supabase
    .from("notificacoes")
    .select("id, tipo, titulo, lida, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Testa INSERT como o usuário logado (sem service key).
  // Cria uma notificação para o próprio usuário, marcando como teste.
  const payloadTeste = {
    user_id: user.id,
    tipo: "diagnostico",
    titulo: "Teste de diagnóstico",
    corpo: `Teste em ${new Date().toLocaleString("pt-BR")}`,
    link: null,
    ator_id: user.id,
    ator_nome: "Diagnóstico",
    ator_avatar: null,
    lida: false,
  };

  const { error: erroInsertSession } = await supabase
    .from("notificacoes")
    .insert(payloadTeste as never);

  // Testa INSERT com service key (se tiver).
  let erroInsertAdmin: string | null = null;
  if (admin) {
    const { error: e } = await admin
      .from("notificacoes")
      .insert({ ...payloadTeste, titulo: "Teste de diagnóstico (admin)" } as never);
    erroInsertAdmin = e?.message ?? null;
  }

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    tem_service_key,
    leitura_ok: !erroSelect,
    erro_leitura: erroSelect?.message ?? null,
    insercao_com_sessao_ok: !erroSelect && !((erroInsertSession as { message?: string } | null)?.message),
    erro_insercao_com_sessao: (erroInsertSession as { message?: string } | null)?.message ?? null,
    insercao_com_admin_ok: tem_service_key && !erroInsertAdmin,
    erro_insercao_com_admin: erroInsertAdmin,
    notificacoes_recentes: existentes ?? [],
    proximos_passos: !tem_service_key
      ? "Configure SUPABASE_SERVICE_ROLE_KEY na Vercel. Sem ela, notificações entre usuários diferentes só funcionam se a RLS da tabela 'notificacoes' permitir INSERT para qualquer usuário autenticado."
      : (erroInsertAdmin
        ? "A inserção com service key falhou. Verifique RLS, colunas e permissões da tabela 'notificacoes'."
        : "Tudo certo! Se ainda assim a notificação não aparece, verifique se o usuário mencionado existe no Auth com nome/email que case com o handle digitado."),
  });
}
