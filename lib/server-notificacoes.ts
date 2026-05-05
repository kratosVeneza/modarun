import { createClient as createServiceClient } from "@supabase/supabase-js";

export function criarAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function criarNotificacaoSegura(payload: Record<string, unknown>) {
  const admin = criarAdminSupabase();
  if (!admin) {
    console.error("SUPABASE_SERVICE_ROLE_KEY ausente: notificação não criada.");
    return { ok: false, error: "admin_client_missing" };
  }

  const { error } = await admin.from("notificacoes").insert({ lida: false, ...payload } as never);
  if (!error) return { ok: true };

  console.error("Falha ao criar notificação completa:", error.message);

  const fallback = {
    user_id: payload.user_id,
    tipo: payload.tipo,
    titulo: payload.titulo,
    corpo: payload.corpo ?? null,
    link: payload.link ?? null,
    lida: false,
  };

  const { error: fallbackError } = await admin.from("notificacoes").insert(fallback as never);
  if (fallbackError) {
    console.error("Falha ao criar notificação fallback:", fallbackError.message);
    return { ok: false, error: fallbackError.message };
  }

  return { ok: true, fallback: true };
}
