import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function nomeDoUsuario(user: any): string {
  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  const nome = meta.nome_exibicao || meta.display_name || meta.full_name || meta.name || meta.nome;
  if (typeof nome === "string" && nome.trim()) return nome.trim();
  if (user?.email) return String(user.email).split("@")[0];
  return "Corredor";
}

function avatarDoUsuario(user: any): string | null {
  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  const avatar = meta.avatar_url || meta.picture || meta.foto_url;
  return typeof avatar === "string" && avatar.trim() ? avatar.trim() : null;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const admin = adminClient();
  const postId = Number(new URL(req.url).searchParams.get("post_id"));

  if (!Number.isFinite(postId) || postId <= 0) {
    return NextResponse.json({ error: "post_id inválido." }, { status: 400 });
  }

  const db: any = admin ?? supabase;

  const { data: curtidas, count, error } = await db
    .from("feed_curtidas")
    .select("user_id, created_at", { count: "exact" })
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids: string[] = Array.from(new Set<string>((curtidas || []).map((c: any) => String(c.user_id)).filter(Boolean)));
  const usuarios: Record<string, { id: string; nome: string; avatar: string | null }> = {};

  if (admin && ids.length > 0) {
    await Promise.all(ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user) {
        usuarios[id] = {
          id,
          nome: nomeDoUsuario(data.user),
          avatar: avatarDoUsuario(data.user),
        };
      }
    }));
  }

  const lista = (curtidas || []).map((c: any) => ({
    user_id: String(c.user_id),
    nome: usuarios[String(c.user_id)]?.nome || "Corredor",
    avatar: usuarios[String(c.user_id)]?.avatar || null,
    created_at: c.created_at,
  }));

  return NextResponse.json({ success: true, total: count ?? lista.length, curtidas: lista });
}

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

  if (acao === "curtir") {
    const { data: post } = await supabase
      .from("feed_posts")
      .select("user_id")
      .eq("id", postId)
      .maybeSingle();

    if (post?.user_id && post.user_id !== user.id) {
      const nome = nomeDoUsuario(user);
      const avatar = avatarDoUsuario(user);
      const admin = adminClient();
      const db: any = admin ?? supabase;
      await db.from("notificacoes").insert({
        user_id: post.user_id,
        tipo: "curtida_post",
        titulo: `${nome} curtiu sua publicação`,
        corpo: "Toque para ver a publicação.",
        post_id: postId,
        link: `/#post-${postId}`,
        ator_id: user.id,
        ator_nome: nome,
        ator_avatar: avatar,
        lida: false,
      } as never).then(() => undefined);
    }
  }

  return NextResponse.json({
    success: true,
    curtido: acao === "curtir",
    total_curtidas: totalCurtidas,
  });
}
