import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function usuarioEhAdmin(email?: string | null) {
  if (!email) return false;
  const admin = adminClient();
  if (!admin) return false;
  const { data } = await admin.from("admins").select("email").eq("email", email.toLowerCase()).maybeSingle();
  return !!data;
}

function limparTexto(v: unknown, limite = 500) {
  return String(v ?? "").trim().slice(0, limite);
}

function colunaInexistente(error: any) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.code === "42703" || msg.includes("column") || msg.includes("schema cache");
}

async function inserirDenuncia(db: any, payload: Record<string, unknown>) {
  const tentativas: Record<string, unknown>[] = [
    payload,
    {
      denunciante_id: payload.denunciante_id,
      tipo: payload.tipo,
      alvo_id: payload.alvo_id,
      alvo_user_id: payload.alvo_user_id,
      post_id: payload.post_id,
      comentario_id: payload.comentario_id,
      motivo: payload.motivo,
      detalhes: payload.detalhes,
      status: payload.status,
    },
    {
      denunciante_id: payload.denunciante_id,
      tipo: payload.tipo,
      alvo_id: payload.alvo_id,
      motivo: payload.motivo,
      detalhes: payload.detalhes,
      status: payload.status,
    },
  ];

  let ultimoErro: any = null;
  for (const tentativa of tentativas) {
    const { data, error } = await db.from("denuncias").insert(tentativa).select("id").single();
    if (!error) return { data, error: null };
    ultimoErro = error;
    if (!colunaInexistente(error)) break;
  }
  return { data: null, error: ultimoErro };
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login para denunciar." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tipo = limparTexto(body.tipo, 40);
  const alvo_id = limparTexto(body.alvo_id, 80);
  const motivo = limparTexto(body.motivo, 80) || "outro";
  const detalhes = limparTexto(body.detalhes, 700);
  const alvo_user_id = body.alvo_user_id ? limparTexto(body.alvo_user_id, 80) : null;
  const post_id = body.post_id ? Number(body.post_id) : null;
  const comentario_id = body.comentario_id ? Number(body.comentario_id) : null;

  if (!["post", "comentario", "usuario", "mensagem"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo de denúncia inválido." }, { status: 400 });
  }
  if (!alvo_id) return NextResponse.json({ error: "Alvo da denúncia é obrigatório." }, { status: 400 });

  const admin = adminClient();
  const db: any = admin ?? supabase;

  const { data: existente, error: existenteErro } = await db
    .from("denuncias")
    .select("id")
    .eq("denunciante_id", user.id)
    .eq("tipo", tipo)
    .eq("alvo_id", alvo_id)
    .maybeSingle();

  if (existenteErro && String(existenteErro.message || "").includes("does not exist")) {
    return NextResponse.json({ error: "Tabela de denúncias não encontrada. Aplique o SQL de migração em supabase/migrations/20260505_moderacao_denuncias_bloqueios.sql." }, { status: 500 });
  }

  if (existente) {
    return NextResponse.json({ success: true, duplicada: true, message: "Você já denunciou este conteúdo." });
  }

  const payload = {
    denunciante_id: user.id,
    denunciante_email: user.email ?? null,
    tipo,
    alvo_id,
    alvo_user_id,
    post_id: Number.isFinite(post_id) ? post_id : null,
    comentario_id: Number.isFinite(comentario_id) ? comentario_id : null,
    motivo,
    detalhes,
    status: "pendente",
  };

  const { data, error } = await inserirDenuncia(db, payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, denuncia_id: data?.id });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await usuarioEhAdmin(user.email))) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status") || "pendente";
  const admin = adminClient();
  const db: any = admin ?? supabase;

  let query = db.from("denuncias").select("*").order("created_at", { ascending: false }).limit(100);
  if (status !== "todas") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ denuncias: data ?? [] });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await usuarioEhAdmin(user.email))) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const acao = limparTexto(body.acao, 40);
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada." }, { status: 500 });
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Denúncia inválida." }, { status: 400 });

  const { data: denuncia, error: denError } = await admin.from("denuncias").select("*").eq("id", id).maybeSingle();
  if (denError || !denuncia) return NextResponse.json({ error: "Denúncia não encontrada." }, { status: 404 });

  async function atualizarDenuncia(update: Record<string, unknown>) {
    const tentativas = [update, { status: update.status, acao_tomada: update.acao_tomada }].filter(Boolean);
    let ultimoErro: any = null;
    for (const t of tentativas) {
      const { error } = await admin.from("denuncias").update(t).eq("id", id);
      if (!error) return null;
      ultimoErro = error;
      if (!colunaInexistente(error)) break;
    }
    return ultimoErro;
  }

  if (acao === "resolver" || acao === "ignorar") {
    const novoStatus = acao === "resolver" ? "resolvida" : "ignorada";
    const error = await atualizarDenuncia({ status: novoStatus, resolvida_em: new Date().toISOString(), resolvida_por: user.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: novoStatus });
  }

  if (acao === "remover_conteudo") {
    if (denuncia.tipo === "post" && denuncia.post_id) {
      const { data: comentariosDoPost } = await admin.from("feed_comentarios").select("id").eq("post_id", denuncia.post_id);
      const idsComentariosDoPost = (comentariosDoPost || []).map((c: any) => c.id).filter(Boolean);
      if (idsComentariosDoPost.length > 0) {
        await admin.from("feed_comentario_curtidas").delete().in("comentario_id", idsComentariosDoPost);
      }
      await admin.from("feed_curtidas").delete().eq("post_id", denuncia.post_id);
      await admin.from("feed_comentarios").delete().eq("post_id", denuncia.post_id);
      const { error } = await admin.from("feed_posts").delete().eq("id", denuncia.post_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (denuncia.tipo === "comentario" && denuncia.comentario_id) {
      const { data: comentario } = await admin.from("feed_comentarios").select("post_id").eq("id", denuncia.comentario_id).maybeSingle();
      const { data: respostas } = await admin.from("feed_comentarios").select("id").eq("resposta_para", denuncia.comentario_id);
      const idsComentarios = [denuncia.comentario_id, ...((respostas || []).map((r: any) => r.id))];
      await admin.from("feed_comentario_curtidas").delete().in("comentario_id", idsComentarios);
      await admin.from("feed_comentarios").delete().eq("resposta_para", denuncia.comentario_id);
      const { error } = await admin.from("feed_comentarios").delete().eq("id", denuncia.comentario_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (comentario?.post_id) {
        const { count } = await admin.from("feed_comentarios").select("id", { count: "exact", head: true }).eq("post_id", comentario.post_id).is("resposta_para", null);
        await admin.from("feed_posts").update({ total_comentarios: count ?? 0 }).eq("id", comentario.post_id);
      }
    }
    const error = await atualizarDenuncia({ status: "resolvida", resolvida_em: new Date().toISOString(), resolvida_por: user.id, acao_tomada: "conteudo_removido" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
