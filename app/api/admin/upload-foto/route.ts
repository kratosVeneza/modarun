import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
  if (!adminRow) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Apenas imagens são permitidas." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Imagem muito grande. Máximo 5MB." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  // Upload direto na raiz do bucket "produtos"
  const { error: uploadError } = await supabase.storage
    .from("produtos")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("produtos").getPublicUrl(fileName);
  return NextResponse.json({ success: true, url: publicUrl });
}
