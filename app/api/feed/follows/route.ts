import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

async function contar(client: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const [{ count: seguidores }, { count: seguindo }] = await Promise.all([
    client.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    client.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  return { seguidores: seguidores ?? 0, seguindo: seguindo ?? 0 };
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const followingId = String(body.following_id ?? "").trim();
  const acao = String(body.acao ?? "");

  if (!isUuid(followingId)) return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
  if (followingId === user.id) return NextResponse.json({ error: "Você não pode seguir você mesmo." }, { status: 400 });
  if (!["seguir", "desseguir"].includes(acao)) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });

  const writeClient = sbAdmin() || supabase;

  if (acao === "seguir") {
    const { error } = await writeClient
      .from("follows")
      .upsert({ follower_id: user.id, following_id: followingId }, { onConflict: "follower_id,following_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.email?.split("@")[0] || "Corredor";
    const avatar = user.user_metadata?.avatar_url || null;

    await writeClient.from("notificacoes").insert({
      user_id: followingId,
      tipo: "novo_seguidor",
      titulo: `${nome} começou a seguir você`,
      corpo: "Abra o perfil para conhecer esse corredor.",
      link: `/perfil/${user.id}`,
      ator_id: user.id,
      ator_nome: nome,
      ator_avatar: avatar,
    } as never);
  } else {
    const { error } = await writeClient
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { seguidores, seguindo } = await contar(supabase, followingId);

  return NextResponse.json({
    success: true,
    viewer_segue: acao === "seguir",
    seguidores,
    seguindo,
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  const viewerId = url.searchParams.get("viewer_id");
  if (!userId) return NextResponse.json({ error: "user_id obrigatorio." }, { status: 400 });

  const [{ count: seguidores }, { count: seguindo }, follow] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    viewerId
      ? supabase.from("follows").select("id").eq("follower_id", viewerId).eq("following_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    seguidores: seguidores ?? 0,
    seguindo: seguindo ?? 0,
    viewer_segue: !!(follow as { data: unknown }).data,
  });
}
