import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type UsuarioDestino = {
  id: string;
  nome: string;
  email?: string | null;
  avatar?: string | null;
  cidade?: string | null;
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  return res;
}

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function texto(value: unknown) {
  return String(value ?? "").trim();
}

function normalizar(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function nomeDoUsuario(user: any) {
  const meta = user?.user_metadata || {};
  return String(
    meta.nome_exibicao ||
    meta.display_name ||
    meta.full_name ||
    meta.name ||
    meta.nome ||
    user?.email?.split("@")[0] ||
    "Corredor"
  );
}

function avatarDoUsuario(user: any) {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || meta.foto || null;
}

function cidadeDoUsuario(user: any) {
  const meta = user?.user_metadata || {};
  return meta.cidade || meta.city || meta.localidade || null;
}

function authParaUsuario(user: any): UsuarioDestino {
  return {
    id: user.id,
    nome: nomeDoUsuario(user),
    email: user.email || null,
    avatar: avatarDoUsuario(user),
    cidade: cidadeDoUsuario(user),
  };
}

async function listarTodosUsuariosAuth(admin: any): Promise<UsuarioDestino[]> {
  const usuarios: UsuarioDestino[] = [];
  let page = 1;
  const perPage = 1000;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const lote = data?.users || [];
    usuarios.push(...lote.map(authParaUsuario));

    if (lote.length < perPage) break;
    page += 1;
  }

  return usuarios;
}

function deduplicar(usuarios: UsuarioDestino[]) {
  const mapa = new Map<string, UsuarioDestino>();
  for (const u of usuarios) {
    if (!u.id) continue;
    const atual = mapa.get(u.id);
    mapa.set(u.id, {
      id: u.id,
      nome: atual?.nome && atual.nome !== "Corredor" ? atual.nome : u.nome,
      email: atual?.email || u.email || null,
      avatar: atual?.avatar || u.avatar || null,
      cidade: atual?.cidade || u.cidade || null,
    });
  }
  return Array.from(mapa.values());
}

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email?.toLowerCase() ?? "")
    .maybeSingle();

  if (!adminRow) return { erro: json({ error: "Acesso negado." }, { status: 403 }) };

  const admin = criarAdminClient();
  if (!admin) {
    return {
      erro: json({ error: "SUPABASE_SERVICE_ROLE_KEY não está configurada. Cadastre essa variável na Vercel em Production." }, { status: 500 }),
    };
  }

  return { supabase, user, admin };
}

export async function GET(req: Request): Promise<NextResponse> {
  const auth = await verificarAdmin();
  if (auth.erro) return auth.erro;

  try {
    const url = new URL(req.url);
    const q = texto(url.searchParams.get("q"));
    if (q.length < 2) return json({ usuarios: [] });

    const termo = normalizar(q);
    const usuarios = await listarTodosUsuariosAuth(auth.admin);

    const filtrados = usuarios
      .filter((u) => {
        const nome = normalizar(u.nome);
        const email = normalizar(u.email);
        return nome.includes(termo) || email.includes(termo) || u.id.toLowerCase() === q.toLowerCase();
      })
      .slice(0, 20);

    return json({ usuarios: filtrados });
  } catch (e: any) {
    return json({ error: e?.message || "Erro ao buscar usuários." }, { status: 500 });
  }
}

async function resolverDestinatarios(admin: any, destino: string, cidade: string | null, userId: string | null) {
  if (destino === "usuario") {
    if (!userId) throw new Error("Selecione um usuário ou informe um UUID manual.");
    if (!uuidRegex.test(userId)) throw new Error("UUID de usuário inválido.");

    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user) throw new Error("Usuário não encontrado no Auth do Supabase.");
    return [authParaUsuario(data.user)];
  }

  const todos = await listarTodosUsuariosAuth(admin);

  if (destino === "cidade") {
    if (!cidade) throw new Error("Informe a cidade.");
    const cidadeNorm = normalizar(cidade);

    const { data: cidadesInteresse } = await admin
      .from("user_cidades_interesse")
      .select("user_id, cidade")
      .ilike("cidade", `%${cidade}%`);

    const idsPorInteresse = new Set(
      (cidadesInteresse || [])
        .filter((row: any) => normalizar(row.cidade).includes(cidadeNorm))
        .map((row: any) => String(row.user_id))
    );

    return todos.filter((u) => idsPorInteresse.has(u.id) || normalizar(u.cidade).includes(cidadeNorm));
  }

  return todos;
}

function limparLink(link: string | null) {
  if (!link) return null;
  if (link.startsWith("/")) return link;
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `/${link}`;
}

export async function POST(req: Request): Promise<NextResponse> {
  const auth = await verificarAdmin();
  if (auth.erro) return auth.erro;

  try {
    const body = await req.json();
    const modo = texto(body.modo || "enviar");
    const titulo = texto(body.titulo).slice(0, 90);
    const corpo = texto(body.corpo).slice(0, 600);
    const destino = texto(body.destino || "todos");
    const cidade = body.cidade ? texto(body.cidade) : null;
    const userIdAlvo = body.user_id ? texto(body.user_id) : null;
    const link = limparLink(body.link ? texto(body.link) : null);

    if (modo !== "preview" && !titulo) return json({ error: "Título obrigatório." }, { status: 400 });
    if (!["todos", "cidade", "usuario"].includes(destino)) return json({ error: "Destino inválido." }, { status: 400 });

    const destinatarios = deduplicar(await resolverDestinatarios(auth.admin, destino, cidade, userIdAlvo));

    if (modo === "preview") {
      return json({
        success: true,
        total: destinatarios.length,
        usuarios: destinatarios.slice(0, 10),
      });
    }

    if (destinatarios.length === 0) {
      return json({ error: "Nenhum destinatário encontrado para esse filtro." }, { status: 400 });
    }

    const notificacoes = destinatarios.map((u) => ({
      user_id: u.id,
      tipo: "mensagem_admin",
      titulo,
      corpo: corpo || null,
      link,
      ator_id: auth.user?.id || null,
      ator_nome: "Moda Run",
      ator_avatar: null,
      lida: false,
    }));

    const tamanhoLote = 500;
    let enviadas = 0;
    for (let i = 0; i < notificacoes.length; i += tamanhoLote) {
      const lote = notificacoes.slice(i, i + tamanhoLote);
      const { error } = await auth.admin.from("notificacoes").insert(lote as never);
      if (error) throw new Error(error.message);
      enviadas += lote.length;
    }

    return json({ success: true, enviadas, destino });
  } catch (e: any) {
    return json({ error: e?.message || "Erro ao enviar notificação." }, { status: 500 });
  }
}
