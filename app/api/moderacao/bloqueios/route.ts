import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function erroTabelaAusente(error: any) {
  const msg = String(error?.message || "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("schema cache");
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const alvo = new URL(req.url).searchParams.get("user_id");
  if (!alvo) return NextResponse.json({ error: "user_id obrigatório." }, { status: 400 });
  const db: any = adminClient() ?? supabase;
  const { data, error } = await db.from("user_blocks").select("id").eq("bloqueador_id", user.id).eq("bloqueado_id", alvo).maybeSingle();
  if (error && erroTabelaAusente(error)) return NextResponse.json({ bloqueado: false, aviso: "Tabela user_blocks não encontrada. Aplique a migração de moderação." });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bloqueado: !!data });
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const bloqueado_id = String(body.bloqueado_id ?? "").trim();
  const acao = String(body.acao ?? "bloquear");
  if (!bloqueado_id) return NextResponse.json({ error: "Usuário obrigatório." }, { status: 400 });
  if (bloqueado_id === user.id) return NextResponse.json({ error: "Você não pode bloquear a si mesmo." }, { status: 400 });

  const admin = adminClient();
  const db: any = admin ?? supabase;

  if (acao === "desbloquear") {
    const { error } = await db.from("user_blocks").delete().eq("bloqueador_id", user.id).eq("bloqueado_id", bloqueado_id);
    if (error && erroTabelaAusente(error)) return NextResponse.json({ error: "Tabela user_blocks não encontrada. Aplique o SQL de migração em supabase/migrations/20260505_moderacao_denuncias_bloqueios.sql." }, { status: 500 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, bloqueado: false });
  }

  const { error } = await db.from("user_blocks").upsert({ bloqueador_id: user.id, bloqueado_id }, { onConflict: "bloqueador_id,bloqueado_id" });
  if (error && erroTabelaAusente(error)) return NextResponse.json({ error: "Tabela user_blocks não encontrada. Aplique o SQL de migração em supabase/migrations/20260505_moderacao_denuncias_bloqueios.sql." }, { status: 500 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deixa de seguir nos dois sentidos ao bloquear, para evitar interação indesejada.
  await db.from("follows").delete().eq("follower_id", user.id).eq("following_id", bloqueado_id);
  await db.from("follows").delete().eq("follower_id", bloqueado_id).eq("following_id", user.id);

  return NextResponse.json({ success: true, bloqueado: true });
}
