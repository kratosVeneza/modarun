"use client";

import React, { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type VariacaoCor = { cor: string; fotos: string[]; tamanhos: string[] };
type Produto = {
  id: string; nome: string; descricao?: string; preco: number;
  preco_promocional?: number; categoria: string;
  fotos: string[]; variacoes_cor: VariacaoCor[];
  cores: string[]; tamanhos: string[];
  estoque_disponivel: boolean; destaque: boolean; whatsapp_msg?: string;
};
type Banner = {
  id: string; titulo?: string; subtitulo?: string;
  imagem_url: string; link_url?: string; link_texto?: string; ativo: boolean; ordem: number;
};

function parseVariacoes(raw: unknown): VariacaoCor[] {
  if (!raw) return [];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  if (Array.isArray(raw)) return raw as VariacaoCor[];
  return [];
}

const CATEGORIAS = ["Todos","Conjuntos","Camisetas","Shorts","Calçados","Meias","Bonés","Acessórios","Performance","Nutrição","Hidratação"];
const CAT_MAP: Record<string, string[]> = {
  "Conjuntos": ["Conjunto"], "Camisetas": ["Camiseta"], "Shorts": ["Shorts"],
  "Calçados": ["Calçado"], "Meias": ["Meia"], "Bonés": ["Boné"],
  "Acessórios": ["Acessório"], "Performance": ["Nutrição","Hidratação","Outro"],
  "Nutrição": ["Nutrição"], "Hidratação": ["Hidratação"],
};
const CAT_ICONS: Record<string, string> = {
  "Todos":"🛒","Conjuntos":"👗","Camisetas":"👕","Shorts":"🩳",
  "Calçados":"👟","Meias":"🧦","Bonés":"🧢","Acessórios":"⌚",
  "Performance":"⚡","Nutrição":"🍌","Hidratação":"💧",
};

// ─── Banner rotativo ──────────────────────────────────────────────────────────
function BannerRotativo({ banners }: { banners: Banner[] }): React.JSX.Element {
  const [atual, setAtual] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => setAtual(i => (i + 1) % banners.length), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  if (banners.length === 0) return <></>;

  const b = banners[atual];
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height: "200px", background: "#21262D" }}>
      <img src={b.imagem_url} alt={b.titulo || "Banner"} className="h-full w-full object-cover transition-opacity duration-700" />
      {(b.titulo || b.subtitulo || b.link_url) && (
        <div className="absolute inset-0 flex flex-col justify-end p-5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)" }}>
          {b.titulo && <p className="font-black text-xl leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff" }}>{b.titulo}</p>}
          {b.subtitulo && <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>{b.subtitulo}</p>}
          {b.link_url && (
            <a href={b.link_url} target="_blank" rel="noreferrer"
              className="mt-2 inline-flex self-start rounded-lg px-3 py-1.5 text-xs font-black"
              style={{ background: "#5CC800", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              {b.link_texto || "VER MAIS"} →
            </a>
          )}
        </div>
      )}
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setAtual(i)}
                className="rounded-full transition-all"
                style={{ width: i === atual ? "20px" : "6px", height: "6px", background: i === atual ? "#5CC800" : "rgba(255,255,255,0.4)" }} />
            ))}
          </div>
          <button onClick={() => setAtual(i => (i - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white font-bold"
            style={{ background: "rgba(0,0,0,0.5)" }}>‹</button>
          <button onClick={() => setAtual(i => (i + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white font-bold"
            style={{ background: "rgba(0,0,0,0.5)" }}>›</button>
        </>
      )}
    </div>
  );
}

// ─── Modal foto ampliada ──────────────────────────────────────────────────────
function ModalFoto({ fotos, indice, onClose }: { fotos: string[]; indice: number; onClose: () => void }): React.JSX.Element {
  const [atual, setAtual] = useState(indice);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 flex items-center gap-1 font-black text-sm"
          style={{ color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>✕ FECHAR</button>
        <img src={fotos[atual]} alt="" className="w-full rounded-2xl object-contain" style={{ maxHeight: "80vh", background: "#21262D" }} />
        {fotos.length > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setAtual(i => (i - 1 + fotos.length) % fotos.length)}
              className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xl"
              style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.3)" }}>‹</button>
            <div className="flex gap-2">
              {fotos.map((_, i) => (
                <button key={i} onClick={() => setAtual(i)}
                  className="rounded-full transition-all"
                  style={{ width: i === atual ? "20px" : "8px", height: "8px", background: i === atual ? "#5CC800" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
            <button onClick={() => setAtual(i => (i + 1) % fotos.length)}
              className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xl"
              style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.3)" }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProdutoCard ──────────────────────────────────────────────────────────────
function ProdutoCard({ produto }: { produto: Produto }): React.JSX.Element {
  const variacoes = parseVariacoes(produto.variacoes_cor);
  const temVariacoes = variacoes.length > 0;
  const [corSelecionada, setCorSelecionada] = useState(temVariacoes ? variacoes[0].cor : (produto.cores?.[0] || ""));
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const variacaoAtual = variacoes.find(v => v.cor === corSelecionada);
  const fotosAtuais = variacaoAtual?.fotos?.length ? variacaoAtual.fotos : (produto.fotos || []);
  const tamanhosAtuais = variacaoAtual?.tamanhos?.length ? variacaoAtual.tamanhos : (produto.tamanhos || []);
  const todasAsCores = temVariacoes ? variacoes.map(v => v.cor) : (produto.cores || []);

  function selecionarCor(cor: string) { setCorSelecionada(cor); setFotoAtiva(0); setTamanhoSelecionado(""); }

  const temDesconto = !!produto.preco_promocional && produto.preco_promocional < produto.preco;
  const precoFinal = temDesconto ? produto.preco_promocional! : produto.preco;
  const desconto = temDesconto ? Math.round(100 - (produto.preco_promocional! / produto.preco) * 100) : 0;
  const fmtPreco = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function gerarLink() {
    let msg = produto.whatsapp_msg || `Olá! Tenho interesse no produto *${produto.nome}* da Moda Run.`;
    if (corSelecionada) msg += `\n\nCor: ${corSelecionada}`;
    if (tamanhoSelecionado) msg += `\nTamanho: ${tamanhoSelecionado}`;
    msg += `\n\nPreço: ${fmtPreco(precoFinal)}`;
    return `https://wa.me/5594920009526?text=${encodeURIComponent(msg)}`;
  }

  return (
    <>
      {modalAberto && fotosAtuais.length > 0 && (
        <ModalFoto fotos={fotosAtuais} indice={fotoAtiva} onClose={() => setModalAberto(false)} />
      )}
      <article className="group relative overflow-hidden rounded-2xl transition-all hover:-translate-y-1"
        style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />

        <div className="relative overflow-hidden cursor-zoom-in" style={{ background: "#21262D", height: "220px" }}
          onClick={() => fotosAtuais.length > 0 && setModalAberto(true)}>
          {fotosAtuais.length > 0 ? (
            <>
              <img key={`${corSelecionada}-${fotoAtiva}`} src={fotosAtuais[fotoAtiva]} alt={produto.nome}
                className="h-full w-full transition duration-300" style={{ objectFit: "contain", padding: "8px" }} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                style={{ background: "rgba(0,0,0,0.3)" }}>
                <span className="rounded-lg px-3 py-1.5 text-xs font-black" style={{ background: "rgba(92,200,0,0.9)", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>🔍 AMPLIAR</span>
              </div>
              {fotosAtuais.length > 1 && (
                <>
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" onClick={e => e.stopPropagation()}>
                    {fotosAtuais.map((_, i) => <button key={i} onClick={() => setFotoAtiva(i)} className="h-1.5 rounded-full transition" style={{ width: i === fotoAtiva ? "16px" : "6px", background: i === fotoAtiva ? "#5CC800" : "rgba(255,255,255,0.4)" }} />)}
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFotoAtiva(i => (i - 1 + fotosAtuais.length) % fotosAtuais.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition font-bold text-lg"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>‹</button>
                  <button onClick={e => { e.stopPropagation(); setFotoAtiva(i => (i + 1) % fotosAtuais.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition font-bold text-lg"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>›</button>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <span className="text-5xl">📷</span>
              <span className="text-xs" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>SEM FOTO</span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
            {produto.destaque && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,184,0,0.2)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>⭐ DESTAQUE</span>}
            {temDesconto && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,107,0,0.2)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>-{desconto}%</span>}
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{produto.categoria.toUpperCase()}</p>
            <h3 className="font-black leading-tight mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", fontSize: "18px" }}>{produto.nome}</h3>
            {produto.descricao && <p className="mt-1 text-xs line-clamp-2" style={{ color: "#8B949E" }}>{produto.descricao}</p>}
          </div>
          <div>
            {temDesconto ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>{fmtPreco(precoFinal)}</span>
                <span className="text-sm line-through" style={{ color: "#8B949E" }}>{fmtPreco(produto.preco)}</span>
              </div>
            ) : <span className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>{fmtPreco(produto.preco)}</span>}
          </div>
          {todasAsCores.length > 0 && (
            <div>
              <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>COR: <span style={{ color: "#5CC800" }}>{corSelecionada}</span></p>
              <div className="flex flex-wrap gap-2">
                {todasAsCores.map(cor => {
                  const v = variacoes.find(x => x.cor === cor);
                  const mini = v?.fotos?.[0];
                  const ativo = corSelecionada === cor;
                  return (
                    <button key={cor} onClick={() => selecionarCor(cor)} className="relative overflow-hidden rounded-xl transition-all"
                      style={{ outline: ativo ? "2px solid #5CC800" : "1px solid rgba(92,200,0,0.2)", outlineOffset: "2px", transform: ativo ? "scale(1.08)" : "scale(1)" }}>
                      {mini ? <img src={mini} alt={cor} className="h-12 w-12 object-cover" /> : <span className="flex h-8 items-center px-3 text-xs font-black" style={{ background: ativo ? "rgba(92,200,0,0.25)" : "#21262D", color: ativo ? "#5CC800" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{cor}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tamanhosAtuais.length > 0 && (
            <div>
              <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>TAMANHO</p>
              <div className="flex flex-wrap gap-1.5">
                {tamanhosAtuais.map(t => (
                  <button key={t} onClick={() => setTamanhoSelecionado(tamanhoSelecionado === t ? "" : t)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-black transition-all"
                    style={{ background: tamanhoSelecionado === t ? "#5CC800" : "#21262D", color: tamanhoSelecionado === t ? "#0D1117" : "#8B949E", border: `1px solid ${tamanhoSelecionado === t ? "#5CC800" : "rgba(92,200,0,0.2)"}`, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2 pt-1">
            <a href={gerarLink()} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              💬 COMPRAR NO WHATSAPP
            </a>
            <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98]"
              style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              📸 VER NO INSTAGRAM
            </a>
          </div>
        </div>
      </article>
    </>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function LojaPage(): React.JSX.Element {
  const authSupabase = createClient();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await authSupabase.auth.getUser();
      setUserEmail(user?.email);
      if (user?.email) {
        const { data } = await authSupabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single();
        setIsAdmin(!!data);
      }
      const [{ data: prods }, { data: bans }] = await Promise.all([
        authSupabase.from("produtos").select("*").eq("estoque_disponivel", true).order("destaque", { ascending: false }).order("ordem").order("criado_em", { ascending: false }),
        authSupabase.from("banners").select("*").eq("ativo", true).order("ordem").order("criado_em", { ascending: false }),
      ]);
      setProdutos((prods || []).map((p: Record<string, unknown>) => ({ ...p, variacoes_cor: parseVariacoes(p.variacoes_cor) })) as Produto[]);
      setBanners(bans || []);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtro por categoria
  const produtosFiltrados = categoriaSelecionada === "Todos"
    ? produtos
    : produtos.filter(p => {
        const cats = CAT_MAP[categoriaSelecionada] || [categoriaSelecionada];
        return cats.some(c => p.categoria.toLowerCase() === c.toLowerCase() || p.categoria === c);
      });

  const destaques = produtos.filter(p => p.destaque);

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero compacto */}
        <section className="px-4 pt-6 pb-4" style={{ background: "#0D1117" }}>
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black mb-2"
                  style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                  🛒 MODA RUN STORE
                </div>
                <h1 className="text-3xl font-black sm:text-4xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
                  LOJA OFICIAL
                </h1>
              </div>
              <div className="flex gap-2">
                <a href="https://wa.me/5594920009526" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  💬 WPP
                </a>
                <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black"
                  style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  📸 IG
                </a>
              </div>
            </div>

            {/* Banner rotativo */}
            {!loading && banners.length > 0 && <BannerRotativo banners={banners} />}
          </div>
        </section>

        {/* Destaques */}
        {!loading && destaques.length > 0 && categoriaSelecionada === "Todos" && (
          <section className="px-4 py-6" style={{ background: "#0D1117" }}>
            <div className="mx-auto max-w-6xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-5 w-1 rounded-full" style={{ background: "#FFB800" }} />
                <h2 className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                  ⭐ EM DESTAQUE
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {destaques.map(p => (
                  <div key={p.id} className="shrink-0 w-64">
                    <ProdutoCard produto={p} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categorias */}
        <section className="px-4 py-4 sticky top-[57px] z-40" style={{ background: "rgba(13,17,23,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(92,200,0,0.1)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {CATEGORIAS.map(cat => {
                const count = cat === "Todos" ? produtos.length : produtos.filter(p => {
                  const cats = CAT_MAP[cat] || [cat];
                  return cats.some(c => p.categoria.toLowerCase() === c.toLowerCase() || p.categoria === c);
                }).length;
                if (count === 0 && cat !== "Todos") return null;
                const ativo = categoriaSelecionada === cat;
                return (
                  <button key={cat} onClick={() => setCategoriaSelecionada(cat)}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all"
                    style={{
                      background: ativo ? "#5CC800" : "rgba(92,200,0,0.08)",
                      color: ativo ? "#0D1117" : "#8B949E",
                      border: ativo ? "1px solid #5CC800" : "1px solid rgba(92,200,0,0.15)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "0.05em",
                    }}>
                    <span>{CAT_ICONS[cat]}</span>
                    <span>{cat.toUpperCase()}</span>
                    {cat !== "Todos" && count > 0 && <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ background: ativo ? "rgba(0,0,0,0.2)" : "rgba(92,200,0,0.15)", color: ativo ? "#0D1117" : "#5CC800" }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Produtos filtrados */}
        <section className="px-4 py-8" style={{ background: "#161B22" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
                <h2 className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                  {categoriaSelecionada === "Todos" ? "TODOS OS PRODUTOS" : `${CAT_ICONS[categoriaSelecionada]} ${categoriaSelecionada.toUpperCase()}`}
                </h2>
              </div>
              <span className="text-sm" style={{ color: "#8B949E" }}>{loading ? "..." : `${produtosFiltrados.length} item${produtosFiltrados.length !== 1 ? "s" : ""}`}</span>
            </div>

            {loading && (
              <div className="flex justify-center py-16">
                <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
              </div>
            )}

            {!loading && produtosFiltrados.length === 0 && (
              <div className="rounded-2xl p-12 text-center" style={{ background: "#21262D", border: "1px dashed rgba(92,200,0,0.2)" }}>
                <p className="text-5xl mb-3">{CAT_ICONS[categoriaSelecionada] || "🛍"}</p>
                <p className="font-black text-xl mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                  {categoriaSelecionada === "Todos" ? "PRODUTOS EM BREVE" : `SEM PRODUTOS EM ${categoriaSelecionada.toUpperCase()}`}
                </p>
                <p className="text-sm mb-5" style={{ color: "#8B949E" }}>Fale pelo WhatsApp para ver o catálogo completo.</p>
                <a href="https://wa.me/5594920009526" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  💬 FALAR NO WHATSAPP
                </a>
              </div>
            )}

            {!loading && produtosFiltrados.length > 0 && (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {produtosFiltrados.map(p => <ProdutoCard key={p.id} produto={p} />)}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-8" style={{ background: "#0D1117" }}>
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#5CC800,#FF6B00,#FFB800)" }} />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>NÃO ENCONTROU O QUE PROCURA?</p>
                  <p className="text-sm mt-0.5" style={{ color: "#8B949E" }}>Fale direto e veja o catálogo completo.</p>
                </div>
                <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver o catálogo completo." target="_blank" rel="noreferrer"
                  className="shrink-0 flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
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
