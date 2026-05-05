import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { criarAdminSupabase, criarNotificacaoSegura } from "@/lib/server-notificacoes";

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const readClient = criarAdminSupabase() || supabase;
  const { data, error } = await readClient
    .from("notificacoes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message, notificacoes: [], nao_lidas: 0 }, { status: 500 });

  const notificacoes = data || [];
  const naoLidas = notificacoes.filter((n: { lida?: boolean | null }) => !n.lida).length;
  return NextResponse.json({ notificacoes, nao_lidas: naoLidas });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = b.id;
  const writeClient = criarAdminSupabase() || supabase;

  const query = writeClient.from("notificacoes").update({ lida: true } as never).eq("user_id", user.id);
  const { error } = id === "todas" ? await query : await query.eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

  const writeClient = criarAdminSupabase() || supabase;
  const { error } = await writeClient.from("notificacoes").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request): Promise<NextResponse> {
  const b = await req.json().catch(() => ({}));
  const result = await criarNotificacaoSegura(b);
  if (!result.ok) return NextResponse.json({ error: result.error || "Erro ao criar notificação." }, { status: 500 });
  return NextResponse.json({ success: true });
}
