import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ESTADOS_VALIDOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

type EventoRaw = {
  nome: string;
  cidade: string;
  estado: string;
  data_evento: string;
  distancia?: string;
  link_inscricao?: string;
};

async function verificarAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("email").eq("email", (user.email || "").toLowerCase()).single();
  return !!data;
}

function parsearData(raw: string): string | null {
  const s = raw.trim().replace(/\s/g, "");
  const partes = s.split(/[./]/);
  if (partes.length < 2) return null;
  const dia = partes[0].padStart(2, "0");
  const mes = partes[1].padStart(2, "0");
  const ano = partes.length >= 3 ? (partes[2].length === 2 ? "20" + partes[2] : partes[2]) : String(new Date().getFullYear());
  const d = parseInt(dia), m = parseInt(mes), a = parseInt(ano);
  if (d < 1 || d > 31 || m < 1 || m > 12 || a < 2024) return null;
  return `${ano}-${mes}-${dia}`;
}

async function buscarEstado(uf: string): Promise<EventoRaw[]> {
  const url = `https://www.corridasbr.com.br/${uf.toLowerCase()}/Calendario.asp`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "Referer": "https://www.corridasbr.com.br/",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const hoje = new Date().toISOString().split("T")[0];
    const eventos: EventoRaw[] = [];

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;

    while ((trMatch = trRegex.exec(html)) !== null) {
      const linha = trMatch[1];
      const tds: string[] = [];
      const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdM: RegExpExecArray | null;
      while ((tdM = tdRe.exec(linha)) !== null) {
        tds.push(tdM[1].replace(/<[^>]+>/g, "").trim());
      }

      if (tds.length < 3) continue;

      const dataISO = parsearData(tds[0]);
      if (!dataISO || dataISO < hoje) continue;

      const cidade = tds[1]?.trim() || "";
      const nome = tds[2]?.trim() || "";
      const distancia = tds[3]?.trim() || undefined;

      if (!nome || nome.length < 4 || !cidade || cidade.length < 2) continue;
      if (/nome da corrida|data|calend/i.test(nome)) continue;
      if (!/\d{2}[./]\d{2}/.test(tds[0])) continue;

      const linkM = linha.match(/href="([^"]*mostracorrida[^"]*)"/i);
      let link: string | undefined;
      if (linkM) {
        const href = linkM[1];
        link = href.startsWith("http") ? href : `https://www.corridasbr.com.br/${uf.toLowerCase()}/${href.replace(/^[./]+/, "")}`;
      }

      eventos.push({
        nome,
        cidade,
        estado: uf.toUpperCase(),
        data_evento: dataISO,
        distancia: distancia && distancia.length < 60 ? distancia : undefined,
        link_inscricao: link,
      });
    }

    return eventos;
  } catch {
    return [];
  }
}

// GET — preview de um estado
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const admin = await verificarAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const uf = request.nextUrl.searchParams.get("estado")?.toUpperCase() || "";
  if (!ESTADOS_VALIDOS.includes(uf)) {
    return NextResponse.json({ error: "Estado inválido. Use a sigla, ex: PA" }, { status: 400 });
  }

  const eventos = await buscarEstado(uf);
  return NextResponse.json({ success: true, estado: uf, total: eventos.length, eventos });
}

// POST — importa eventos de um ou mais estados
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const admin = await verificarAdmin(supabase);

  // Permite também via cron key
  const cronKey = request.headers.get("x-cron-key");
  const cronValido = cronKey && cronKey === process.env.CRON_SECRET;

  if (!admin && !cronValido) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json() as { estado?: string; todos?: boolean };
  const uf = body.estado?.toUpperCase();
  const estados = body.todos
    ? ESTADOS_VALIDOS
    : uf && ESTADOS_VALIDOS.includes(uf)
      ? [uf]
      : null;

  if (!estados) {
    return NextResponse.json({ error: "Informe estado (sigla) ou todos:true" }, { status: 400 });
  }

  // Carregar eventos já existentes
  const hoje = new Date().toISOString().split("T")[0];
  const { data: existentes } = await supabase
    .from("eventos")
    .select("nome, data_evento, estado")
    .gte("data_evento", hoje);

  const jaExiste = new Set(
    (existentes || []).map(e =>
      `${(e.nome || "").toLowerCase().trim()}|${e.data_evento}|${(e.estado || "").toUpperCase()}`
    )
  );

  let totalImportados = 0;
  let totalIgnorados = 0;
  const erros: string[] = [];

  // Processar em lotes de 3 estados em paralelo
  for (let i = 0; i < estados.length; i += 3) {
    const lote = estados.slice(i, i + 3);
    const resultados = await Promise.all(lote.map(u => buscarEstado(u)));

    for (let j = 0; j < lote.length; j++) {
      const ufAtual = lote[j];
      const todos = resultados[j];

      const novos = todos.filter(e => {
        const chave = `${e.nome.toLowerCase().trim()}|${e.data_evento}|${e.estado}`;
        return !jaExiste.has(chave);
      });

      totalIgnorados += todos.length - novos.length;
      if (novos.length === 0) continue;

      // Inserir em batches de 50
      for (let k = 0; k < novos.length; k += 50) {
        const batch = novos.slice(k, k + 50);
        const { error } = await supabase.from("eventos").insert(
          batch.map(e => ({
            nome: e.nome,
            cidade: e.cidade,
            estado: e.estado,
            data_evento: e.data_evento,
            distancia: e.distancia || null,
            link_inscricao: e.link_inscricao || null,
            destaque: false,
          }))
        );

        if (error) {
          erros.push(`${ufAtual}: ${error.message}`);
        } else {
          totalImportados += batch.length;
          batch.forEach(e =>
            jaExiste.add(`${e.nome.toLowerCase().trim()}|${e.data_evento}|${e.estado}`)
          );
        }
      }
    }

    // Pausa entre lotes
    if (i + 3 < estados.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return NextResponse.json({
    success: true,
    importados: totalImportados,
    ignorados: totalIgnorados,
    erros: erros.length > 0 ? erros : undefined,
    mensagem: `${totalImportados} eventos importados, ${totalIgnorados} já existiam.`,
  });
}
