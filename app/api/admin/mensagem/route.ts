import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
  if (!adminRow) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const b = await req.json();
  const titulo = String(b.titulo ?? "").trim();
  const corpo = String(b.corpo ?? "").trim();
  const destino = String(b.destino ?? "todos");
  const cidade = b.cidade ? String(b.cidade).trim() : null;
  const user_id_alvo = b.user_id ? String(b.user_id) : null;
  const link = b.link ? String(b.link).trim() : null;

  if (!titulo) return NextResponse.json({ error: "Titulo obrigatorio." }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let userIds: string[] = [];

  if (destino === "usuario" && user_id_alvo) {
    userIds = [user_id_alvo];
  } else if (destino === "cidade" && cidade) {
    const { data: cidades } = await admin.from("user_cidades_interesse").select("user_id").ilike("cidade", `%${cidade}%`);
    userIds = [...new Set((cidades || []).map((c: { user_id: string }) => c.user_id))];
  } else {
    const { data: posts } = await admin.from("feed_posts").select("user_id");
    userIds = [...new Set((posts || []).map((p: { user_id: string }) => p.user_id))];
  }

  if (userIds.length === 0) return NextResponse.json({ success: true, enviadas: 0 });

  const notifs = userIds.map(uid => ({
    user_id: uid, tipo: "mensagem_admin", titulo,
    corpo: corpo || null, link: link || null, ator_nome: "Moda Run", ator_avatar: null,
  }));

  const { error } = await admin.from("notificacoes").insert(notifs as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, enviadas: notifs.length });
}
