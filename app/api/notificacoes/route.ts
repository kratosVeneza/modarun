import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function sbAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("notificacoes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const naoLidas = (data || []).filter((n: { lida: boolean }) => !n.lida).length;
  return NextResponse.json({ notificacoes: data || [], nao_lidas: naoLidas });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const id = b.id;

  if (id === "todas") {
    await supabase.from("notificacoes").update({ lida: true } as never).eq("user_id", user.id);
  } else {
    await supabase.from("notificacoes").update({ lida: true } as never).eq("id", id).eq("user_id", user.id);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

  await supabase.from("notificacoes").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}

export async function POST(req: Request): Promise<NextResponse> {
  const b = await req.json();
  await sbAdmin().from("notificacoes").insert(b as never);
  return NextResponse.json({ success: true });
}
