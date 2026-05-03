import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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
      await writeClient.from("notificacoes").insert({
        user_id: followingId,
        tipo: "novo_seguidor",
        titulo: `${nome} começou a seguir você`,
        corpo: "Abra o perfil para conhecer esse corredor.",
        link: `/perfil/${user.id}`,
        ator_id: user.id,
        ator_nome: nome,
        ator_avatar: avatar,
        lida: false,
      } as never).then(() => undefined);
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

async function perfilBasico(client: any, id: string) {
  let authUser: any = null;
  const admin = sbAdmin();

  if (admin) {
    const { data } = await admin.auth.admin.getUserById(id);
    authUser = data?.user || null;
  }

  const { data: postAutor } = await client
    .from("feed_posts")
    .select("user_id, autor_nome, autor_avatar, autor_email, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const meta = authUser?.user_metadata || {};
  const email = authUser?.email || postAutor?.autor_email || null;
  const nome =
    meta?.nome_exibicao ||
    meta?.display_name ||
    meta?.full_name ||
    meta?.name ||
    meta?.nome ||
    postAutor?.autor_nome ||
    email?.split("@")[0] ||
    "Corredor";

  return {
    id,
    nome,
    avatar: meta?.avatar_url || meta?.picture || meta?.foto || postAutor?.autor_avatar || null,
    email,
  };
}

async function listarFollows(client: any, userId: string, tipo: "seguidores" | "seguindo", viewerId?: string) {
  const colunaFiltro = tipo === "seguidores" ? "following_id" : "follower_id";
  const colunaPessoa = tipo === "seguidores" ? "follower_id" : "following_id";

  const { data: rows, error } = await client
    .from("follows")
    .select(`id, follower_id, following_id, created_at`)
    .eq(colunaFiltro, userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const ids = Array.from(new Set((rows || []).map((r: any) => String(r[colunaPessoa])).filter(isUuid)));
  const usuarios = await Promise.all(ids.map((id) => perfilBasico(client, id)));

  let seguindoSet = new Set<string>();
  if (viewerId && isUuid(viewerId) && ids.length > 0) {
    const { data: rels } = await client
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .in("following_id", ids);
    seguindoSet = new Set((rels || []).map((r: any) => String(r.following_id)));
  }

  return usuarios.map((u) => ({ ...u, viewer_segue: seguindoSet.has(u.id) }));
}

export async function GET(req: Request): Promise<NextResponse> {
  const { supabase, user } = await getCurrentUser();
  const url = new URL(req.url);
  const userId = String(url.searchParams.get("user_id") || url.searchParams.get("following_id") || "").trim();
  const viewerId = String(url.searchParams.get("viewer_id") || user?.id || "").trim();
  const lista = String(url.searchParams.get("lista") || "").trim();

  if (!isUuid(userId)) return json({ error: "user_id inválido." }, { status: 400 });

  const readClient = sbAdmin() || supabase;

  try {
    if (lista === "seguidores" || lista === "seguindo") {
      const usuarios = await listarFollows(readClient, userId, lista, viewerId);
      return json({ success: true, tipo: lista, total: usuarios.length, usuarios });
    }

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
