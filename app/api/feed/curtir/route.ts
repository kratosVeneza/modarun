import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const postId = Number(body.post_id);
  const acao = String(body.acao ?? "");

  if (!Number.isFinite(postId) || postId <= 0) {
    return NextResponse.json({ error: "post_id inválido." }, { status: 400 });
  }

  if (!["curtir", "descurtir"].includes(acao)) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  if (acao === "curtir") {
    const { error } = await supabase
      .from("feed_curtidas")
      .upsert({ post_id: postId, user_id: user.id }, { onConflict: "post_id,user_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("feed_curtidas")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count, error: countError } = await supabase
    .from("feed_curtidas")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const totalCurtidas = count ?? 0;

  await supabase
    .from("feed_posts")
    .update({ total_curtidas: totalCurtidas } as never)
    .eq("id", postId);

  return NextResponse.json({
    success: true,
    curtido: acao === "curtir",
    total_curtidas: totalCurtidas,
  });
}
