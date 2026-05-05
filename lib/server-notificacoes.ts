import { createClient as createServiceClient } from "@supabase/supabase-js";

type SupabaseLike = {
  from: (table: string) => any;
};

type CriarNotificacaoOptions = {
  /**
   * Cliente autenticado da própria rota. Serve como fallback quando a service key
   * não está configurada na Vercel ou quando a política RLS já permite INSERT.
   */
  fallbackClient?: SupabaseLike | null;
};

export function criarAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function tipoCompatibilidade(tipo: unknown) {
  const t = String(tipo || "");
  if (t === "mencao_comentario") return "comentario_post";
  if (t === "curtida_comentario") return "curtida_post";
  if (t === "resposta_comentario") return "comentario_post";
  if (t === "novo_seguidor") return "seguir";
  if (t === "mensagem_privada") return "mensagem";
  return t;
}

function limparPayload(payload: Record<string, unknown>) {
  const limpo: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(payload)) {
    if (valor !== undefined) limpo[chave] = valor;
  }
  return limpo;
}

function payloadMinimo(payload: Record<string, unknown>, tipo?: string) {
  return limparPayload({
    user_id: payload.user_id,
    tipo: tipo ?? payload.tipo,
    titulo: payload.titulo,
    corpo: payload.corpo ?? null,
    link: payload.link ?? null,
    lida: false,
  });
}

function candidatosPayload(payload: Record<string, unknown>) {
  const completo = limparPayload({ lida: false, ...payload });
  const tipoFallback = tipoCompatibilidade(payload.tipo);

  const candidatos: Record<string, unknown>[] = [
    completo,
    payloadMinimo(payload),
  ];

  if (tipoFallback && tipoFallback !== payload.tipo) {
    candidatos.push(
      limparPayload({ ...completo, tipo: tipoFallback }),
      payloadMinimo(payload, tipoFallback),
    );
  }

  // Remove duplicados sem depender de ordem de chaves externa.
  const vistos = new Set<string>();
  return candidatos.filter((item) => {
    const chave = JSON.stringify(item, Object.keys(item).sort());
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

export async function criarNotificacaoSegura(payload: Record<string, unknown>, options: CriarNotificacaoOptions = {}) {
  if (!payload?.user_id || !payload?.titulo) {
    return { ok: false, error: "payload_invalido" };
  }

  const clientes = [criarAdminSupabase(), options.fallbackClient].filter(Boolean) as SupabaseLike[];
  if (clientes.length === 0) {
    console.error("Nenhum cliente disponível para criar notificação. Configure SUPABASE_SERVICE_ROLE_KEY ou passe fallbackClient.");
    return { ok: false, error: "client_missing" };
  }

  const tentativas = candidatosPayload(payload);
  let ultimoErro = "";

  for (const client of clientes) {
    for (const item of tentativas) {
      const { error } = await client.from("notificacoes").insert(item as never);
      if (!error) return { ok: true };
      ultimoErro = error.message || String(error);
      console.error("Falha ao criar notificação. Tentando fallback:", ultimoErro);
    }
  }

  return { ok: false, error: ultimoErro || "erro_ao_criar_notificacao" };
}
