import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const confirmacao = String(body.confirmacao ?? "").trim().toUpperCase();
  if (confirmacao !== "EXCLUIR") {
    return NextResponse.json({ error: "Digite EXCLUIR para confirmar." }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "Exclusão indisponível: service role não configurada." }, { status: 500 });

  const uid = user.id;

  // Limpeza dos dados sociais do app. Tabelas inexistentes são ignoradas via Promise.allSettled.
  await Promise.allSettled([
    admin.from("mensagens").update({ apagada_para_todos: true, apagada_em: new Date().toISOString(), apagada_por: uid }).or(`remetente_id.eq.${uid},destinatario_id.eq.${uid}`),
    admin.from("feed_comentario_curtidas").delete().eq("user_id", uid),
    admin.from("feed_curtidas").delete().eq("user_id", uid),
    admin.from("feed_comentarios").delete().eq("user_id", uid),
    admin.from("feed_posts").delete().eq("user_id", uid),
    admin.from("follows").delete().or(`follower_id.eq.${uid},following_id.eq.${uid}`),
    admin.from("user_blocks").delete().or(`bloqueador_id.eq.${uid},bloqueado_id.eq.${uid}`),
    admin.from("denuncias").delete().or(`denunciante_id.eq.${uid},alvo_user_id.eq.${uid}`),
    admin.from("notificacoes").delete().eq("user_id", uid),
    admin.from("user_cidades_interesse").delete().eq("user_id", uid),
    admin.from("user_eventos_salvos").delete().eq("user_id", uid),
  ]);

  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
