import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { criarNotificacaoSegura } from "@/lib/server-notificacoes";

function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function contar(client: any, userId: string) {
  const [{ count: seguidores, error: erroSeguidores }, { count: seguindo, error: erroSeguindo }] = await Promise.all([
    client.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    client.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  if (erroSeguidores || erroSeguindo) {
    throw new Error(erroSeguidores?.message || erroSeguindo?.message || "Erro ao contar seguidores.");
  }

  return { seguidores: seguidores ?? 0, seguindo: seguindo ?? 0 };
}

async function viewerSegue(client: any, viewerId: string, followingId: string) {
  if (!isUuid(viewerId) || !isUuid(followingId)) return false;

  const { count, error } = await client
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", viewerId)
    .eq("following_id", followingId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

async function existeBloqueioEntre(client: any, a: string, b: string) {
  const { data, error } = await client
    .from("user_blocks")
    .select("id")
    .or(`and(bloqueador_id.eq.${a},bloqueado_id.eq.${b}),and(bloqueador_id.eq.${b},bloqueado_id.eq.${a})`)
    .limit(1);
  if (error) return false;
  return (data || []).length > 0;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return { supabase, user: null };
  return { supabase, user };
}

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  return res;
}

export async function POST(req: Request): Promise<NextResponse> {
  const { supabase, user } = await getCurrentUser();
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const followingId = String(body.following_id ?? body.user_id ?? "").trim();
  const acao = String(body.acao ?? body.action ?? "").trim();

  if (!isUuid(followingId)) return json({ error: "Usuário inválido." }, { status: 400 });
  if (followingId === user.id) return json({ error: "Você não pode seguir você mesmo." }, { status: 400 });
  if (!["seguir", "desseguir"].includes(acao)) return json({ error: "Ação inválida." }, { status: 400 });

  // Usa service role quando disponível para não depender de RLS mal configurado.
  // Ainda assim, a identidade do usuário vem da sessão autenticada acima.
  const writeClient = sbAdmin() || supabase;

  try {
    if (acao === "seguir" && await existeBloqueioEntre(writeClient, user.id, followingId)) {
      return json({ error: "Não é possível seguir este usuário." }, { status: 403 });
    }

    if (acao === "seguir") {
      const { error } = await writeClient
        .from("follows")
        .insert({ follower_id: user.id, following_id: followingId });

      // 23505 = já seguia. Não é erro para o usuário.
      if (error && error.code !== "23505") throw new Error(error.message);

      const nome =
        user.user_metadata?.nome_exibicao ||
        user.user_metadata?.full_name ||
        user.user_metadata?.nome ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Corredor";
      const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      // Notificação não pode impedir o follow.
      await criarNotificacaoSegura({
        user_id: followingId,
        tipo: "novo_seguidor",
        titulo: `${nome} começou a seguir você`,
        corpo: "Abra o perfil para conhecer esse corredor.",
        link: `/perfil/${user.id}`,
        ator_id: user.id,
        ator_nome: nome,
        ator_avatar: avatar,
      }, { fallbackClient: supabase });
    } else {
      const { error } = await writeClient
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", followingId);

      if (error) throw new Error(error.message);
    }

    const [contagens, seguePersistido] = await Promise.all([
      contar(writeClient, followingId),
      viewerSegue(writeClient, user.id, followingId),
    ]);

    return json({ success: true, viewer_segue: seguePersistido, ...contagens });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar seguimento.";
    return json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const { supabase, user } = await getCurrentUser();
  const url = new URL(req.url);
  const userId = String(url.searchParams.get("user_id") || url.searchParams.get("following_id") || "").trim();
  const viewerId = String(url.searchParams.get("viewer_id") || user?.id || "").trim();

  if (!isUuid(userId)) return json({ error: "user_id inválido." }, { status: 400 });

  const readClient = sbAdmin() || supabase;

  try {
    const [contagens, segue] = await Promise.all([
      contar(readClient, userId),
      viewerId && isUuid(viewerId) ? viewerSegue(readClient, viewerId, userId) : Promise.resolve(false),
    ]);

    return json({ success: true, ...contagens, viewer_segue: segue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao consultar seguidores.";
    return json({ error: message }, { status: 500 });
  }
}
