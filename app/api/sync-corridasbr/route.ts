import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ESTADOS_VALIDOS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

type EventoRaw = {
  nome: string;
  cidade: string;
  estado: string;
  data_evento: string;
  distancia?: string;
  link_inscricao?: string;
  chave_evento: string;
};

async function verificarAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", (user.email || "").toLowerCase())
    .single();

  return !!data;
}

function parsearData(raw: string): string | null {
  const s = raw.trim().replace(/\s/g, "");
  const partes = s.split(/[./]/);

  if (partes.length < 2) return null;

  const dia = partes[0].padStart(2, "0");
  const mes = partes[1].padStart(2, "0");
  const ano =
    partes.length >= 3
      ? partes[2].length === 2
        ? "20" + partes[2]
        : partes[2]
      : String(new Date().getFullYear());

  const d = parseInt(dia);
  const m = parseInt(mes);
  const a = parseInt(ano);

  if (d < 1 || d > 31 || m < 1 || m > 12 || a < 2024) return null;

  return `${ano}-${mes}-${dia}`;
}

function decodificarHtml(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);

  /**
   * Se aparecer "�", é forte sinal de que o HTML não foi lido corretamente.
   * O CorridasBR costuma retornar conteúdo compatível com Windows-1252/Latin.
   */
  if (utf8.includes("�")) {
    return new TextDecoder("windows-1252").decode(buffer);
  }

  return utf8;
}

function limparHtmlTexto(valor: string): string {
  return (valor || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&atilde;/gi, "ã")
    .replace(/&otilde;/gi, "õ")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&acirc;/gi, "â")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&agrave;/gi, "à")
    .replace(/&ordf;/gi, "ª")
    .replace(/&ordm;/gi, "º")
    .replace(/&#170;/g, "ª")
    .replace(/&#186;/g, "º")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTexto(valor: string): string {
  return (valor || "")
    .replace(/�/g, "")
    .replace(/ª/g, "a")
    .replace(/º/g, "o")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&amp;/g, "e")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function criarChaveEvento(evento: {
  nome: string;
  cidade: string;
  estado: string;
  data_evento: string;
}): string {
  return [
    normalizarTexto(evento.nome),
    normalizarTexto(evento.cidade),
    normalizarTexto(evento.estado).toUpperCase(),
    evento.data_evento,
  ].join("|");
}

async function buscarEstado(uf: string): Promise<EventoRaw[]> {
  const url = `https://www.corridasbr.com.br/${uf.toLowerCase()}/Calendario.asp`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
        Referer: "https://www.corridasbr.com.br/",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return [];

    const buffer = await res.arrayBuffer();
    const html = decodificarHtml(buffer);

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
        tds.push(limparHtmlTexto(tdM[1]));
      }

      if (tds.length < 3) continue;

      const dataISO = parsearData(tds[0]);
      if (!dataISO || dataISO < hoje) continue;

      const cidade = limparHtmlTexto(tds[1] || "");
      const nome = limparHtmlTexto(tds[2] || "");
      const distancia = limparHtmlTexto(tds[3] || "");

      if (!nome || nome.length < 4 || !cidade || cidade.length < 2) continue;
      if (/nome da corrida|data|calend/i.test(nome)) continue;
      if (!/\d{2}[./]\d{2}/.test(tds[0])) continue;

      const linkM = linha.match(/href="([^"]*mostracorrida[^"]*)"/i);

      let link: string | undefined;

      if (linkM) {
        const href = linkM[1];

        link = href.startsWith("http")
          ? href
          : `https://www.corridasbr.com.br/${uf.toLowerCase()}/${href.replace(
              /^[./]+/,
              ""
            )}`;
      }

      const eventoBase = {
        nome,
        cidade,
        estado: uf.toUpperCase(),
        data_evento: dataISO,
      };

      eventos.push({
        ...eventoBase,
        distancia: distancia && distancia.length < 60 ? distancia : undefined,
        link_inscricao: link,
        chave_evento: criarChaveEvento(eventoBase),
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

  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const uf = request.nextUrl.searchParams.get("estado")?.toUpperCase() || "";

  if (!ESTADOS_VALIDOS.includes(uf)) {
    return NextResponse.json(
      { error: "Estado inválido. Use a sigla, ex: PA" },
      { status: 400 }
    );
  }

  const eventos = await buscarEstado(uf);

  return NextResponse.json({
    success: true,
    estado: uf,
    total: eventos.length,
    eventos,
  });
}

// POST — importa eventos de um ou mais estados
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const admin = await verificarAdmin(supabase);

  const cronKey = request.headers.get("x-cron-key");
  const cronValido = cronKey && cronKey === process.env.CRON_SECRET;

  if (!admin && !cronValido) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as { estado?: string; todos?: boolean };
  const uf = body.estado?.toUpperCase();

  const estados = body.todos
    ? ESTADOS_VALIDOS
    : uf && ESTADOS_VALIDOS.includes(uf)
    ? [uf]
    : null;

  if (!estados) {
    return NextResponse.json(
      { error: "Informe estado (sigla) ou todos:true" },
      { status: 400 }
    );
  }

  const hoje = new Date().toISOString().split("T")[0];

  const { data: existentes } = await supabase
    .from("eventos")
    .select("nome, cidade, estado, data_evento, chave_evento")
    .gte("data_evento", hoje);

  const jaExiste = new Set(
    (existentes || []).map((e) => {
      if (e.chave_evento) return e.chave_evento;

      return criarChaveEvento({
        nome: e.nome || "",
        cidade: e.cidade || "",
        estado: e.estado || "",
        data_evento: e.data_evento || "",
      });
    })
  );

  let totalImportados = 0;
  let totalIgnorados = 0;
  const erros: string[] = [];

  for (let i = 0; i < estados.length; i += 3) {
    const lote = estados.slice(i, i + 3);
    const resultados = await Promise.all(lote.map((u) => buscarEstado(u)));

    for (let j = 0; j < lote.length; j++) {
      const ufAtual = lote[j];
      const todos = resultados[j];

      const novos = todos.filter((e) => !jaExiste.has(e.chave_evento));

      totalIgnorados += todos.length - novos.length;

      if (novos.length === 0) continue;

      for (let k = 0; k < novos.length; k += 50) {
        const batch = novos.slice(k, k + 50);

        const { error } = await supabase.from("eventos").upsert(
          batch.map((e) => ({
            nome: e.nome,
            cidade: e.cidade,
            estado: e.estado,
            data_evento: e.data_evento,
            distancia: e.distancia || null,
            link_inscricao: e.link_inscricao || null,
            destaque: false,
            chave_evento: e.chave_evento,
          })),
          {
            onConflict: "chave_evento",
            ignoreDuplicates: true,
          }
        );

        if (error) {
          erros.push(`${ufAtual}: ${error.message}`);
        } else {
          totalImportados += batch.length;
          batch.forEach((e) => jaExiste.add(e.chave_evento));
        }
      }
    }

    if (i + 3 < estados.length) {
      await new Promise((r) => setTimeout(r, 1500));
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