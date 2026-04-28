import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const pid = Number(b.post_id);
  const a = String(b.acao);

  if (a === "curtir") {
    await supabase.rpc("incrementar_curtida", { p_post_id: pid, p_user_id: user.id });
  } else {
    await supabase.rpc("decrementar_curtida", { p_post_id: pid, p_user_id: user.id });
  }

  const { data } = await supabase
    .from("feed_posts")
    .select("total_curtidas")
    .eq("id", pid)
    .single();

  return NextResponse.json({ success: true, total_curtidas: data?.total_curtidas ?? 0 });
}
