"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

type Produto = {
  id: string; nome: string; preco: number; preco_promocional?: number;
  fotos: string[]; variacoes_cor: { cor: string; fotos: string[] }[];
};

type Banner = {
  id: string;
  titulo?: string;
  subtitulo?: string;
  imagem_url: string;
  link_url?: string;
  link_texto?: string;
  paginas?: string[];
  produto_id?: string;
  ativo?: boolean;
  ordem?: number;
};

type Variante = "feed" | "banner" | "inline";

const PAGINA_KEY: Record<Variante, string> = {
  feed: "feed",
  banner: "calculadora-pace",
  inline: "eventos",
};

export default function CardLoja({ variante = "inline", paginaKey }: { variante?: Variante; paginaKey?: string }) {
  const [produto, setProduto] = useState<Produto | null>(null);
  const [bannerPropaganda, setBannerPropaganda] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelado = false;
    const supabase = createClient();
    const key = paginaKey || PAGINA_KEY[variante];

    async function buscarProdutoDestaque() {
      const { data: p } = await supabase
        .from("produtos")
        .select("id, nome, preco, preco_promocional, fotos, variacoes_cor")
        .eq("estoque_disponivel", true)
        .order("destaque", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelado && p) {
        setProduto(p);
      }
    }

    async function carregarPropaganda() {
      setBannerPropaganda(null);
      setProduto(null);

      const { data: banners, error } = await supabase
        .from("banners")
        .select("id, titulo, subtitulo, imagem_url, link_url, link_texto, paginas, produto_id, ativo, ordem")
        .eq("ativo", true)
        .contains("paginas", [key])
        .order("ordem", { ascending: true })
        .limit(1);

      const banner = banners?.[0] ?? null;

      if (!error && banner) {
        if (cancelado) return;

        setBannerPropaganda(banner);

        if (banner.produto_id) {
          const { data: p } = await supabase
            .from("produtos")
            .select("id, nome, preco, preco_promocional, fotos, variacoes_cor")
            .eq("id", banner.produto_id)
            .maybeSingle();

          if (!cancelado && p) {
            setProduto(p);
          }
        }

        return;
      }

      await buscarProdutoDestaque();
    }

    carregarPropaganda();

    return () => {
      cancelado = true;
    };
  }, [variante, paginaKey]);

  const usandoBanner = !!bannerPropaganda;
  const fotoBanner = bannerPropaganda?.imagem_url ?? null;
  const fotoProduto = produto?.variacoes_cor?.[0]?.fotos?.[0] ?? produto?.fotos?.[0] ?? null;
  const foto = usandoBanner ? (fotoBanner || fotoProduto) : fotoProduto;
  const titulo = usandoBanner
    ? (bannerPropaganda!.titulo ?? produto?.nome ?? "Loja Moda Run")
    : (produto?.nome ?? "Equipamentos para corredores");
  const subtitulo = usandoBanner ? bannerPropaganda!.subtitulo : null;
  const href = usandoBanner
    ? (bannerPropaganda!.link_url ?? (produto ? "/loja/" + produto.id : "/loja"))
    : (produto ? "/loja/" + produto.id : "/loja");
  const linkTexto = usandoBanner ? (bannerPropaganda!.link_texto ?? "VER NA LOJA") : "VER NA LOJA";
  const preco = !usandoBanner || bannerPropaganda?.produto_id
    ? (produto?.preco_promocional ?? produto?.preco)
    : null;
  const temDesconto = produto?.preco_promocional && produto.preco_promocional < produto.preco;

  if (!bannerPropaganda && !produto) return null;

  if (variante === "feed") {
    return (
      <Link href={href}
        className="block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #161B22, #1a0f00)", border: "1px solid rgba(255,107,0,0.25)" }}>
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #FF6B00, #FFB800, #5CC800)" }} />
        <div className="p-4 flex gap-4 items-center">
          {foto ? (
            <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: 80, height: 80 }}>
              <img src={foto} alt={titulo} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="shrink-0 rounded-xl flex items-center justify-center" style={{ width: 80, height: 80, background: "rgba(255,107,0,0.1)" }}>
              <ShoppingBag size={28} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black mb-1 flex items-center gap-1" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
              <ShoppingBag size={10} strokeWidth={2} /> LOJA MODA RUN
            </p>
            <p className="font-black text-sm leading-tight truncate" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{titulo}</p>
            {subtitulo && <p className="text-xs mt-0.5 truncate" style={{ color: "#8B949E" }}>{subtitulo}</p>}
            {preco && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-black text-base" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  R$ {preco.toFixed(2).replace(".", ",")}
                </span>
                {temDesconto && (
                  <span className="text-xs line-through" style={{ color: "#8B949E" }}>
                    R$ {produto!.preco.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center justify-center rounded-xl px-3 py-2"
            style={{ background: "linear-gradient(135deg, #FF6B00, #FFB800)", color: "#fff" }}>
            <ArrowRight size={18} strokeWidth={2.5} />
          </div>
        </div>
      </Link>
    );
  }

  if (variante === "banner") {
    return (
      <Link href={href}
        className="block rounded-2xl overflow-hidden transition-all hover:brightness-110"
        style={{ background: "linear-gradient(135deg, #1a0900, #161B22)", border: "1px solid rgba(255,107,0,0.3)" }}>
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #FF6B00, #FFB800)" }} />
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag size={14} strokeWidth={2} style={{ color: "#FF6B00" }} />
            <p className="text-xs font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>LOJA MODA RUN</p>
          </div>
          {foto && (
            <div className="rounded-xl overflow-hidden mb-3" style={{ height: 140 }}>
              <img src={foto} alt={titulo} className="w-full h-full object-cover" />
            </div>
          )}
          <p className="font-black text-sm mb-1" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{titulo}</p>
          {subtitulo && <p className="text-xs mb-2" style={{ color: "#8B949E" }}>{subtitulo}</p>}
          {preco && (
            <p className="font-black text-lg mb-3" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
              R$ {preco.toFixed(2).replace(".", ",")}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 rounded-xl py-2 font-black text-sm"
            style={{ background: "linear-gradient(135deg, #FF6B00, #FFB800)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {linkTexto} <ArrowRight size={14} strokeWidth={2.5} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}
      className="flex items-center gap-4 rounded-2xl overflow-hidden transition-all hover:brightness-110"
      style={{ background: "linear-gradient(135deg, #1a0900, #161B22)", border: "1px solid rgba(255,107,0,0.25)" }}>
      <div className="relative shrink-0 overflow-hidden" style={{ width: 100, minHeight: 80 }}>
        {foto ? (
          <img src={foto} alt={titulo} className="w-full h-full object-cover absolute inset-0" style={{ minHeight: 80 }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center absolute inset-0" style={{ background: "rgba(255,107,0,0.1)", minHeight: 80 }}>
            <ShoppingBag size={24} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent, #1a0900)" }} />
      </div>
      <div className="flex-1 py-3 pr-4">
        <p className="text-xs font-black mb-0.5" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>LOJA MODA RUN</p>
        <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{titulo}</p>
        {subtitulo && <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{subtitulo}</p>}
        {preco ? (
          <p className="text-sm font-black mt-0.5" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
            R$ {preco.toFixed(2).replace(".", ",")} &rarr;
          </p>
        ) : (
          <p className="text-xs font-black mt-0.5" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {linkTexto} &rarr;
          </p>
        )}
      </div>
    </Link>
  );
}
