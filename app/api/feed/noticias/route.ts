import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * /api/feed/noticias — Notícias de corrida, sempre atualizadas.
 *
 * Arquitetura (por que mudou):
 * As 3 fontes RSS antigas morreram/bloquearam bots — a aba ficava vazia.
 * Agora a fonte primária é o Google News RSS (agregador: nunca seca, formato
 * estável, feito pra consumo por máquina), com buscas segmentadas em PT-BR.
 * Fontes diretas continuam como bônus: se responderem, entram; se
 * bloquearem, nada quebra.
 *
 * Rede de segurança: a cada busca bem-sucedida, o resultado é salvo na tabela
 * noticias_cache do Supabase. Se TODAS as fontes falharem (queda de rede,
 * bloqueio geral), a API serve o último lote salvo — a aba nunca fica vazia.
 *
 * Contrato de saída (INALTERADO — o front não precisa de nenhuma mudança):
 * { noticias: [{ titulo, url, fonte, imagem, data, resumo }] }
 */

type NoticiaItem = {
  titulo: string;
  url: string;
  fonte: string;
  imagem: string | null;
  data: string;
  resumo: string;
};

// ── Fontes ────────────────────────────────────────────────────────────────────
// Google News RSS: q = busca, hl/gl/ceid = Brasil português.
// "when:7d" limita à última semana (mantém a aba sempre fresca).
const GOOGLE_NEWS = [
  { q: `"corrida de rua" when:7d`, fonte: "Google News" },
  { q: `maratona brasil when:7d`, fonte: "Google News" },
  { q: `atletismo corrida treino when:7d`, fonte: "Google News" },
];

// Fontes diretas (bônus — falha silenciosa se bloquearem):
const FONTES_DIRETAS = [
  { url: "https://webrun.com.br/feed/", fonte: "Webrun" },
  { url: "https://runnersbrasil.com/feed/", fonte: "Runners Brasil" },
];

const UA =
  "Mozilla/5.0 (compatible; ModaRunNews/1.0; +https://modarun.com.br)";

// ── Parsing RSS ───────────────────────────────────────────────────────────────
function limpar(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairImagem(item: string): string | null {
  return (
    item.match(/media:content[^>]+url="([^"]+)"/)?.[1] ??
    item.match(/enclosure[^>]+url="([^"]+)"/)?.[1] ??
    item.match(/<img[^>]+src="([^"]+)"/)?.[1] ??
    null
  );
}

function parseRss(xml: string, fonteFallback: string, max: number): NoticiaItem[] {
  return (xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [])
    .slice(0, max)
    .map((item) => {
      // Google News embute a fonte real em <source>
      const fonteReal = limpar(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "");
      return {
        titulo: limpar(item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? ""),
        url: limpar(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "#"),
        fonte: fonteReal || fonteFallback,
        imagem: extrairImagem(item),
        data: item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "",
        resumo: limpar(item.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ?? "").slice(0, 180),
      };
    })
    .filter((n) => n.titulo && n.url.startsWith("http"));
}

async function buscarUrl(url: string, fonte: string, max = 8): Promise<NoticiaItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
    });
    if (!res.ok) return [];
    return parseRss(await res.text(), fonte, max);
  } catch {
    return [];
  }
}

// ── Dedup: Google News repete a mesma matéria em buscas diferentes ────────────
function dedup(noticias: NoticiaItem[]): NoticiaItem[] {
  const vistos = new Set<string>();
  return noticias.filter((n) => {
    // normaliza título pra comparar (Google costuma sufixar " - Fonte")
    const chave = n.titulo.toLowerCase().replace(/\s*[-–|].{0,40}$/, "").slice(0, 80);
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

// ── Cache de emergência no Supabase (opcional: falha silenciosa) ──────────────
async function salvarCache(noticias: NoticiaItem[]): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("noticias_cache").upsert(
      { id: 1, noticias, atualizado_em: new Date().toISOString() },
      { onConflict: "id" }
    );
  } catch {
    /* tabela pode não existir ainda — sem problema */
  }
}

async function lerCache(): Promise<NoticiaItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("noticias_cache").select("noticias").eq("id", 1).single();
    return (data?.noticias as NoticiaItem[]) ?? [];
  } catch {
    return [];
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  const buscas = [
    ...GOOGLE_NEWS.map((g) =>
      buscarUrl(
        `https://news.google.com/rss/search?q=${encodeURIComponent(g.q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`,
        g.fonte,
        10
      )
    ),
    ...FONTES_DIRETAS.map((f) => buscarUrl(f.url, f.fonte, 5)),
  ];

  const resultados = await Promise.allSettled(buscas);
  let noticias = dedup(
    resultados
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  ).slice(0, 15);

  if (noticias.length > 0) {
    // sucesso → atualiza o cache de emergência (não bloqueia a resposta)
    salvarCache(noticias);
  } else {
    // todas as fontes falharam → serve o último lote bom
    noticias = await lerCache();
  }

  return NextResponse.json(
    { noticias },
    {
      headers: {
        // CDN do Vercel: cache de 30min + serve versão anterior por mais 1h
        // enquanto revalida em background. Notícia fresca sem custo por acesso.
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  );
}
