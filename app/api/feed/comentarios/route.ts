import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function sbAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function criarNotificacao(payload: Record<string, unknown>) {
  await sbAdmin().from("notificacoes").insert(payload as never);
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const post_id = Number(b.post_id);
  const texto = String(b.texto ?? "").trim();
  const resposta_para = b.resposta_para ? Number(b.resposta_para) : null;
  if (!texto) return NextResponse.json({ error: "Comentario vazio." }, { status: 400 });

  const meta = user.user_metadata as Record<string, unknown>;
  const autor_nome = String(meta?.nome_exibicao ?? meta?.display_name ?? meta?.full_name ?? meta?.name ?? meta?.nome ?? user.email?.split("@")[0] ?? "Corredor");
  const autor_avatar = ((meta?.avatar_url || meta?.picture) as string | undefined) ?? null;

  const { data, error } = await supabase
    .from("feed_comentarios")
    .insert({ post_id, user_id: user.id, texto, autor_nome, autor_avatar, resposta_para })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase
    .from("feed_comentarios")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post_id)
    .is("resposta_para", null);
  await supabase.from("feed_posts").update({ total_comentarios: count ?? 0 }).eq("id", post_id);

  const { data: post } = await supabase.from("feed_posts").select("user_id").eq("id", post_id).single();

  if (resposta_para) {
    const { data: pai } = await supabase.from("feed_comentarios").select("user_id").eq("id", resposta_para).single();
    if (pai?.user_id && pai.user_id !== user.id) {
      await criarNotificacao({
        user_id: pai.user_id, tipo: "resposta_comentario",
        titulo: `${autor_nome} respondeu seu comentario`,
        corpo: texto.slice(0, 80),
        post_id, ator_id: user.id, ator_nome: autor_nome, ator_avatar: autor_avatar,
      });
    }
  } else if (post?.user_id && post.user_id !== user.id) {
    await criarNotificacao({
      user_id: post.user_id, tipo: "comentario_post",
      titulo: `${autor_nome} comentou sua publicacao`,
      corpo: texto.slice(0, 80),
      post_id, ator_id: user.id, ator_nome: autor_nome, ator_avatar: autor_avatar,
    });
  }

  return NextResponse.json({ success: true, comentario: { ...data, autor_nome, autor_avatar } });
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const post_id = new URL(req.url).searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id obrigatorio." }, { status: 400 });

  const { data, error } = await supabase
    .from("feed_comentarios")
    .select("id, texto, created_at, autor_nome, autor_avatar, user_id, resposta_para, total_curtidas")
    .eq("post_id", post_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comentarios: data ?? [] });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const acao = String(b.acao);

  if (acao === "editar") {
    const id = Number(b.id);
    const texto = String(b.texto ?? "").trim();
    if (!texto) return NextResponse.json({ error: "Texto vazio." }, { status: 400 });
    const { error } = await supabase.from("feed_comentarios").update({ texto }).eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (acao === "curtir" || acao === "descurtir") {
    const id = Number(b.id);
    if (acao === "curtir") {
      await supabase.from("feed_comentario_curtidas").upsert({ comentario_id: id, user_id: user.id }, { onConflict: "comentario_id,user_id" });
    } else {
      await supabase.from("feed_comentario_curtidas").delete().eq("comentario_id", id).eq("user_id", user.id);
    }
    const { count } = await supabase.from("feed_comentario_curtidas").select("*", { count: "exact", head: true }).eq("comentario_id", id);
    await supabase.from("feed_comentarios").update({ total_curtidas: count ?? 0 }).eq("id", id);
    return NextResponse.json({ success: true, total_curtidas: count ?? 0 });
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  const post_id = new URL(req.url).searchParams.get("post_id");
  if (!id) return NextResponse.json({ error: "id obrigatorio." }, { status: 400 });

  await supabase.from("feed_comentarios").delete().eq("id", id).eq("user_id", user.id);

  if (post_id) {
    const { count } = await supabase.from("feed_comentarios").select("*", { count: "exact", head: true }).eq("post_id", post_id).is("resposta_para", null);
    await supabase.from("feed_posts").update({ total_comentarios: count ?? 0 }).eq("id", post_id);
  }
  return NextResponse.json({ success: true });
}
