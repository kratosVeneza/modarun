import { NextResponse } from "next/server";

type NoticiaItem = {
  titulo: string;
  url: string;
  fonte: string;
  imagem: string | null;
  data: string;
  resumo: string;
};

const FONTES = [
  { url: "https://www.corridaparatodos.com.br/feed/", fonte: "Corrida Para Todos" },
  { url: "https://www.runners.com.br/feed/", fonte: "Runners" },
  { url: "https://www.runbrasil.com.br/feed/", fonte: "Run Brasil" },
];

function limpar(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

function imagem(item: string): string | null {
  return item.match(/media:content[^>]+url="([^"]+)"/)?.[1]
    ?? item.match(/enclosure[^>]+url="([^"]+)"/)?.[1]
    ?? item.match(/<img[^>]+src="([^"]+)"/)?.[1]
    ?? null;
}

async function buscarFonte(fonte: { url: string; fonte: string }): Promise<NoticiaItem[]> {
  try {
    const res = await fetch(fonte.url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return (xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []).slice(0, 5).map(item => ({
      titulo: limpar(item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? ""),
      url: item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "#",
      fonte: fonte.fonte,
      imagem: imagem(item),
      data: item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "",
      resumo: limpar(item.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ?? "").slice(0, 180),
    })).filter(n => n.titulo && n.url !== "#");
  } catch {
    return [];
  }
}

export async function GET(): Promise<NextResponse> {
  const resultados = await Promise.allSettled(FONTES.map(buscarFonte));
  const noticias = resultados
    .flatMap(r => r.status === "fulfilled" ? r.value : [])
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 12);
  return NextResponse.json({ noticias }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  });
}
