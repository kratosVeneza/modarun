"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";

type VariacaoCor = { cor: string; fotos: string[] };
type Produto = {
  id: string; nome: string; descricao?: string; preco: number;
  preco_promocional?: number; categoria: string; fotos: string[];
  variacoes_cor: VariacaoCor[]; cores: string[]; tamanhos: string[];
  estoque_disponivel: boolean; destaque: boolean; whatsapp_msg?: string;
};

function ProdutoCard({ produto }: { produto: Produto }): React.JSX.Element {
  const temVariacoes = produto.variacoes_cor && produto.variacoes_cor.length > 0;
  const primeiraCor = temVariacoes ? produto.variacoes_cor[0].cor : (produto.cores[0] || "");
  const [corSelecionada, setCorSelecionada] = useState(primeiraCor);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");

  const fotosAtuais: string[] = (() => {
    if (temVariacoes) {
      const v = produto.variacoes_cor.find(v => v.cor === corSelecionada);
      if (v && v.fotos.length > 0) return v.fotos;
    }
    return produto.fotos || [];
  })();

  function selecionarCor(cor: string) { setCorSelecionada(cor); setFotoAtiva(0); }

  const temDesconto = !!produto.preco_promocional && produto.preco_promocional < produto.preco;
  const precoFinal = temDesconto ? produto.preco_promocional! : produto.preco;
  const desconto = temDesconto ? Math.round(100 - (produto.preco_promocional! / produto.preco) * 100) : 0;
  const fmtPreco = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const todasAsCores = temVariacoes ? produto.variacoes_cor.map(v => v.cor) : produto.cores;

  function gerarLink() {
    let msg = produto.whatsapp_msg || `Olá! Tenho interesse no produto *${produto.nome}* da Moda Run.`;
    if (corSelecionada) msg += `\n\nCor: ${corSelecionada}`;
    if (tamanhoSelecionado) msg += `\nTamanho: ${tamanhoSelecionado}`;
    msg += `\n\nPreço: ${fmtPreco(precoFinal)}`;
    return `https://wa.me/5594920009526?text=${encodeURIComponent(msg)}`;
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl transition-all hover:-translate-y-1"
      style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>

      {/* Linha topo colorida */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />

      {/* Galeria */}
      <div className="relative overflow-hidden" style={{ background: "#21262D", height: "220px" }}>
        {fotosAtuais.length > 0 ? (
          <>
            <img src={fotosAtuais[fotoAtiva]} alt={produto.nome}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            {fotosAtuais.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {fotosAtuais.map((_, i) => (
                    <button key={i} onClick={() => setFotoAtiva(i)}
                      className="h-1.5 w-1.5 rounded-full transition"
                      style={{ background: i === fotoAtiva ? "#5CC800" : "rgba(255,255,255,0.4)" }} />
                  ))}
                </div>
                <button onClick={() => setFotoAtiva(i => (i - 1 + fotosAtuais.length) % fotosAtuais.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>‹</button>
                <button onClick={() => setFotoAtiva(i => (i + 1) % fotosAtuais.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>›</button>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" style={{ color: "#30363D" }}>🛍</div>
        )}
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className="rounded-lg px-2.5 py-1 text-xs font-bold"
            style={{ background: "rgba(13,17,23,0.8)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", backdropFilter: "blur(8px)" }}>
            {produto.categoria.toUpperCase()}
          </span>
          {produto.destaque && (
            <span className="rounded-lg px-2.5 py-1 text-xs font-black"
              style={{ background: "rgba(255,184,0,0.2)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              ⭐ DESTAQUE
            </span>
          )}
          {temDesconto && (
            <span className="rounded-lg px-2.5 py-1 text-xs font-black"
              style={{ background: "rgba(255,107,0,0.2)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              -{desconto}%
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-black leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", fontSize: "18px", letterSpacing: "0.01em" }}>
            {produto.nome}
          </h3>
          {produto.descricao && <p className="mt-1 text-xs line-clamp-2" style={{ color: "#8B949E" }}>{produto.descricao}</p>}
        </div>

        {/* Preço */}
        <div>
          {temDesconto ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>{fmtPreco(precoFinal)}</span>
              <span className="text-sm line-through" style={{ color: "#8B949E" }}>{fmtPreco(produto.preco)}</span>
            </div>
          ) : (
            <span className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>{fmtPreco(produto.preco)}</span>
          )}
        </div>

        {/* Cores */}
        {todasAsCores.length > 0 && (
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
              COR: <span style={{ color: "#E6EDF3" }}>{corSelecionada}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {todasAsCores.map(cor => {
                const variacao = produto.variacoes_cor?.find(v => v.cor === cor);
                const miniFoto = variacao?.fotos?.[0];
                const ativo = corSelecionada === cor;
                return (
                  <button key={cor} onClick={() => selecionarCor(cor)}
                    className="relative overflow-hidden rounded-lg transition-all"
                    style={{ outline: ativo ? "2px solid #5CC800" : "1px solid rgba(92,200,0,0.2)", outlineOffset: "2px" }}>
                    {miniFoto ? (
                      <img src={miniFoto} alt={cor} className="h-10 w-10 object-cover" />
                    ) : (
                      <span className="flex h-8 items-center px-3 text-xs font-bold"
                        style={{ background: ativo ? "rgba(92,200,0,0.2)" : "#21262D", color: ativo ? "#5CC800" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {cor}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tamanhos */}
        {produto.tamanhos.length > 0 && (
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>TAMANHO</p>
            <div className="flex flex-wrap gap-1.5">
              {produto.tamanhos.map(t => (
                <button key={t} onClick={() => setTamanhoSelecionado(tamanhoSelecionado === t ? "" : t)}
                  className="rounded-lg px-2.5 py-1 text-xs font-black transition-all"
                  style={{
                    background: tamanhoSelecionado === t ? "#5CC800" : "#21262D",
                    color: tamanhoSelecionado === t ? "#0D1117" : "#8B949E",
                    border: tamanhoSelecionado === t ? "1px solid #5CC800" : "1px solid rgba(92,200,0,0.2)",
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2 pt-1">
          <a href={gerarLink()} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all hover:scale-[1.02] hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            💬 COMPRAR NO WHATSAPP
          </a>
          <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all hover:scale-[1.02]"
            style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            📸 VER NO INSTAGRAM
          </a>
        </div>
      </div>
    </article>
  );
}

export default function LojaPage(): React.JSX.Element {
  const authSupabase = createClient();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await authSupabase.auth.getUser();
      setUserEmail(user?.email);
      if (user?.email) {
        const { data } = await authSupabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single();
        setIsAdmin(!!data);
      }
      const { data } = await authSupabase.from("produtos").select("*")
        .eq("estoque_disponivel", true)
        .order("destaque", { ascending: false })
        .order("ordem").order("criado_em", { ascending: false });
      setProdutos((data || []).map((p: Record<string, unknown>) => ({
        ...p, variacoes_cor: (p.variacoes_cor as VariacaoCor[]) || [],
      })) as Produto[]);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-16" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent 70%)" }} />
            <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #FF6B00, transparent 70%)" }} />
          </div>
          <div className="relative mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
                style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                🛒 MODA RUN STORE
              </div>
              <h1 className="text-4xl font-black sm:text-6xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "-0.01em", lineHeight: 1 }}>
                CORRA NA MODA.<br /><span style={{ color: "#5CC800" }}>VISTA-SE</span> <span style={{ color: "#FF6B00" }}>PARA</span><br />VENCER.
              </h1>
              <p className="mt-3 text-sm" style={{ color: "#8B949E" }}>
                {loading ? "Carregando..." : `${produtos.length} ${produtos.length === 1 ? "item disponível" : "itens disponíveis"}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run." target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                💬 WHATSAPP
              </a>
              <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:scale-105"
                style={{ border: "2px solid rgba(255,107,0,0.4)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                📸 INSTAGRAM
              </a>
            </div>
          </div>
        </section>

        {/* Produtos */}
        <section className="px-4 py-12" style={{ background: "#161B22" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-1 rounded-full" style={{ background: "#5CC800" }} />
              <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>PRODUTOS</h2>
            </div>

            {loading && (
              <div className="flex justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
              </div>
            )}

            {!loading && produtos.length === 0 && (
              <div className="rounded-2xl p-16 text-center" style={{ background: "#21262D", border: "1px dashed rgba(92,200,0,0.2)" }}>
                <p className="text-5xl mb-3">🛍</p>
                <p className="font-black text-xl mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>PRODUTOS EM BREVE</p>
                <p className="text-sm mb-6" style={{ color: "#8B949E" }}>Entre em contato pelo WhatsApp para ver o catálogo completo.</p>
                <a href="https://wa.me/5594920009526" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-black"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  💬 FALAR NO WHATSAPP
                </a>
              </div>
            )}

            {!loading && produtos.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {produtos.map(produto => <ProdutoCard key={produto.id} produto={produto} />)}
              </div>
            )}
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 py-12" style={{ background: "#0D1117" }}>
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00, #FFB800)" }} />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>NÃO ENCONTROU O QUE PROCURA?</p>
                  <p className="text-sm mt-1" style={{ color: "#8B949E" }}>Fale direto e veja o catálogo completo da Moda Run.</p>
                </div>
                <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver o catálogo completo." target="_blank" rel="noreferrer"
                  className="shrink-0 flex items-center gap-2 rounded-xl px-6 py-3 font-black text-sm transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  💬 FALAR COM A MODA RUN
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
