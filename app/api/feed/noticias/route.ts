import { NextResponse } from "next/server";

type NoticiaItem = {
  titulo: string;
  url: string;
  fonte: string;
  imagem: string | null;
  data: string;
  resumo: string;
};

// Fontes RSS de corrida de rua brasileiras
const FONTES_RSS = [
  { url: "https://www.corridaparatodos.com.br/feed/", fonte: "Corrida Para Todos" },
  { url: "https://www.runners.com.br/feed/", fonte: "Runners" },
  { url: "https://www.runbrasil.com.br/feed/", fonte: "Run Brasil" },
];

function extrairImagem(item: string): string | null {
  const mediaMatch = item.match(/media:content[^>]+url="([^"]+)"/);
  if (mediaMatch) return mediaMatch[1];
  const enclosureMatch = item.match(/enclosure[^>]+url="([^"]+)"/);
  if (enclosureMatch) return enclosureMatch[1];
  const imgMatch = item.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch) return imgMatch[1];
  return null;
}

function limparHtml(texto: string): string {
  return texto
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function buscarRSS(fonte: { url: string; fonte: string }): Promise<NoticiaItem[]> {
  try {
    const res = await fetch(fonte.url, {
      headers: { "User-Agent": "ModaRun/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    return items.slice(0, 5).map(item => {
      const titulo = limparHtml(item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const url = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "#";
      const data = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
      const resumo = limparHtml(item.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ?? "").slice(0, 180);
      const imagem = extrairImagem(item);

      return { titulo, url, fonte: fonte.fonte, imagem, data, resumo };
    }).filter(n => n.titulo && n.url !== "#");
  } catch {
    return [];
  }
}

export async function GET(): Promise<NextResponse> {
  const resultados = await Promise.allSettled(FONTES_RSS.map(buscarRSS));

  const noticias: NoticiaItem[] = resultados
    .flatMap(r => r.status === "fulfilled" ? r.value : [])
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 12);

  return NextResponse.json(
    { noticias },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
