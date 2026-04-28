import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const following_id = String(b.following_id);
  const acao = String(b.acao);

  if (acao === "seguir") {
    await supabase
      .from("follows")
      .upsert({ follower_id: user.id, following_id }, { onConflict: "follower_id,following_id" });
  } else {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", following_id);
  }

  const { count: seguidores } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", following_id);

  const { count: seguindo } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", following_id);

  return NextResponse.json({ success: true, seguidores: seguidores ?? 0, seguindo: seguindo ?? 0 });
}
export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id");
  const viewer_id = url.searchParams.get("viewer_id");
  if (!user_id) return NextResponse.json({ error: "user_id obrigatorio." }, { status: 400 });

  const [{ count: seguidores }, { count: seguindo }, follow] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user_id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user_id),
    viewer_id
      ? supabase.from("follows").select("id").eq("follower_id", viewer_id).eq("following_id", user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    seguidores: seguidores ?? 0,
    seguindo: seguindo ?? 0,
    viewer_segue: !!(follow as { data: unknown }).data,
  });
}
