import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

  const { data: existente } = await db
    .from("denuncias")
    .select("id")
    .eq("denunciante_id", user.id)
    .eq("tipo", tipo)
    .eq("alvo_id", alvo_id)
    .maybeSingle();

  if (existente) {
    return NextResponse.json({ success: true, duplicada: true, message: "Você já denunciou este conteúdo." });
  }

  const { data, error } = await db.from("denuncias").insert({
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
  }).select("id").single();

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

  const { data: denuncia, error: denError } = await admin.from("denuncias").select("*").eq("id", id).maybeSingle();
  if (denError || !denuncia) return NextResponse.json({ error: "Denúncia não encontrada." }, { status: 404 });

  if (acao === "resolver" || acao === "ignorar") {
    const novoStatus = acao === "resolver" ? "resolvida" : "ignorada";
    const { error } = await admin.from("denuncias").update({ status: novoStatus, resolvida_em: new Date().toISOString(), resolvida_por: user.id }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: novoStatus });
  }

  if (acao === "remover_conteudo") {
    if (denuncia.tipo === "post" && denuncia.post_id) {
      await admin.from("feed_posts").delete().eq("id", denuncia.post_id);
    }
    if (denuncia.tipo === "comentario" && denuncia.comentario_id) {
      await admin.from("feed_comentarios").delete().eq("id", denuncia.comentario_id);
    }
    await admin.from("denuncias").update({ status: "resolvida", resolvida_em: new Date().toISOString(), resolvida_por: user.id, acao_tomada: "conteudo_removido" }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
