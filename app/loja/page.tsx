"use client";
import Link from "next/link";

import React, { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import { useCarrinho } from "@/contexts/CarrinhoContext";
import CarrinhoDrawer from "@/components/CarrinhoDrawer";
import CarrinhoFAB from "@/components/CarrinhoFAB";

// ─── Types ────────────────────────────────────────────────────────────────────

type VariacaoCor = { cor: string; fotos: string[]; tamanhos: string[]; esgotado?: boolean; tamanhos_esgotados?: string[] };
type Produto = {
  id: string; nome: string; descricao?: string; preco: number;
  preco_promocional?: number; categoria: string;
  fotos: string[]; variacoes_cor: VariacaoCor[];
  cores: string[]; tamanhos: string[];
  estoque_disponivel: boolean; destaque: boolean; whatsapp_msg?: string; quantidade?: number | null;
};
type BannerDisplayConfig = { modo?: "cover" | "contain"; altura?: number; position_x?: number; position_y?: number };
type Banner = {
  id: string; titulo?: string; subtitulo?: string;
  imagem_url: string; link_url?: string; link_texto?: string; ativo: boolean; ordem: number;
  position_x?: number; position_y?: number;
  exibir_loja?: boolean;
  config_paginas?: Record<string, BannerDisplayConfig> | null;
};

function parseVariacoes(raw: unknown): VariacaoCor[] {
  if (!raw) return [];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  if (Array.isArray(raw)) return raw as VariacaoCor[];
  return [];
}

const CAT_ICONS_DEFAULT: Record<string, string> = {
  "todos":"🛒","conjunto":"👗","camiseta":"👕","shorts":"🩳","calçado":"👟",
  "meia":"🧦","boné":"🧢","acessório":"⌚","nutrição":"🍌","hidratação":"💧",
  "jaqueta":"🧥","moletom":"🧥","legging":"🩱","top":"👙","outro":"🏷",
};
function getCatIcon(cat: string): string {
  return CAT_ICONS_DEFAULT[cat.toLowerCase()] || "🏷";
}

// ─── Banner rotativo (mantido como estava) ────────────────────────────────────
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
  const cfg = b.config_paginas?.loja ?? {};
  const altura = cfg.altura ?? 280;
  const modo = cfg.modo ?? "cover";
  const objectPosition = `${Number(cfg.position_x ?? b.position_x ?? 50)}% ${Number(cfg.position_y ?? b.position_y ?? 50)}%`;
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height: altura, background: "#21262D" }}>
      <img src={b.imagem_url} alt={b.titulo || "Banner"} className="h-full w-full transition-opacity duration-700"
        style={{ objectFit: modo, objectPosition }} />
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

// ─── Modal foto ampliada (mantido) ───────────────────────────────────────────
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

// ─── ProdutoCard refinado + integrado ao carrinho ────────────────────────────
function ProdutoCard({ produto }: { produto: Produto }): React.JSX.Element {
  const variacoes = parseVariacoes(produto.variacoes_cor);
  const temVariacoes = variacoes.length > 0;
  const [corSelecionada, setCorSelecionada] = useState<string | null>(null);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [feedback, setFeedback] = useState<null | "ok" | "falta">(null);
  const { adicionar, abrir } = useCarrinho();

  const variacaoAtual = variacoes.find(v => v.cor === corSelecionada);
  const fotosAtuais = corSelecionada && variacaoAtual?.fotos?.length
    ? variacaoAtual.fotos
    : (produto.fotos?.length ? produto.fotos : (variacoes[0]?.fotos || []));
  const tamanhosAtuais = variacaoAtual?.tamanhos?.length ? variacaoAtual.tamanhos : (produto.tamanhos || []);
  const todasAsCores = temVariacoes ? variacoes.map(v => v.cor) : (produto.cores || []);
  const corEsgotada = variacaoAtual?.esgotado === true;

  function selecionarCor(cor: string) {
    setCorSelecionada(prev => prev === cor ? null : cor);
    setFotoAtiva(0);
    setTamanhoSelecionado("");
  }

  const temDesconto = !!produto.preco_promocional && produto.preco_promocional < produto.preco;
  const precoFinal = temDesconto ? produto.preco_promocional! : produto.preco;
  const desconto = temDesconto ? Math.round(100 - (produto.preco_promocional! / produto.preco) * 100) : 0;
  const fmtPreco = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Validação: precisa de cor (se houver opções) e tamanho (se houver opções)
  function validarSelecao(): { ok: boolean; motivo?: string } {
    if (todasAsCores.length > 0 && !corSelecionada) {
      return { ok: false, motivo: "Escolha uma cor" };
    }
    if (corEsgotada) {
      return { ok: false, motivo: "Cor esgotada" };
    }
    if (tamanhosAtuais.length > 0 && !tamanhoSelecionado) {
      return { ok: false, motivo: "Escolha um tamanho" };
    }
    return { ok: true };
  }

  function handleAdicionar({ abrirDrawer }: { abrirDrawer: boolean }) {
    const { ok } = validarSelecao();
    if (!ok) {
      setFeedback("falta");
      setTimeout(() => setFeedback(null), 1800);
      return;
    }
    adicionar({
      produto_id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      preco_unitario: precoFinal,
      preco_original: temDesconto ? produto.preco : undefined,
      cor: corSelecionada || undefined,
      tamanho: tamanhoSelecionado || undefined,
      foto: fotosAtuais[fotoAtiva] || undefined,
    });
    setFeedback("ok");
    setTimeout(() => setFeedback(null), 1500);
    if (abrirDrawer) abrir();
  }

  return (
    <>
      {modalAberto && fotosAtuais.length > 0 && (
        <ModalFoto fotos={fotosAtuais} indice={fotoAtiva} onClose={() => setModalAberto(false)} />
      )}
      <article className="group relative overflow-hidden rounded-2xl transition-all hover:-translate-y-1"
        style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />

        {/* Imagem */}
        <div className="relative overflow-hidden cursor-zoom-in" style={{ background: "#21262D", height: "240px" }}
          onClick={() => fotosAtuais.length > 0 && setModalAberto(true)}>
          {fotosAtuais.length > 0 ? (
            <>
              <img key={`${corSelecionada}-${fotoAtiva}`} src={fotosAtuais[fotoAtiva]} alt={produto.nome}
                className="h-full w-full transition duration-300 group-hover:scale-105"
                style={{ objectFit: "contain", padding: "8px", opacity: corEsgotada ? 0.45 : 1 }} />
              {corEsgotada && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="rounded-xl px-4 py-2 text-sm font-black rotate-[-12deg]"
                    style={{ background: "rgba(255,107,0,0.9)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em", border: "2px solid #FF6B00", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                    🚫 ESGOTADO
                  </div>
                </div>
              )}
              {!corEsgotada && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "rgba(0,0,0,0.3)" }}>
                  <span className="rounded-lg px-3 py-1.5 text-xs font-black" style={{ background: "rgba(92,200,0,0.9)", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>🔍 AMPLIAR</span>
                </div>
              )}
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
          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
            {produto.destaque && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,184,0,0.2)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>⭐ DESTAQUE</span>}
            {temDesconto && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,107,0,0.2)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>-{desconto}%</span>}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-3">
          {/* Categoria + nome + preço */}
          <div>
            <p className="text-[10px] font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>{produto.categoria.toUpperCase()}</p>
            <Link href={`/loja/${produto.id}`} onClick={e => e.stopPropagation()}
              className="hover:opacity-80 transition-opacity block mt-0.5">
              <h3 className="font-black leading-tight line-clamp-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", fontSize: "18px", minHeight: "2.4em" }}>{produto.nome}</h3>
            </Link>
            <div className="mt-2">
              {temDesconto ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>{fmtPreco(precoFinal)}</span>
                  <span className="text-xs line-through" style={{ color: "#8B949E" }}>{fmtPreco(produto.preco)}</span>
                </div>
              ) : <span className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>{fmtPreco(produto.preco)}</span>}
            </div>
          </div>

          {/* Cores */}
          {todasAsCores.length > 0 && (
            <div>
              <p className="text-[10px] font-black mb-1.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                COR: <span style={{ color: corSelecionada ? (corEsgotada ? "#FF6B00" : "#5CC800") : "#8B949E" }}>
                  {corSelecionada ? corSelecionada.toUpperCase() + (corEsgotada ? " — ESGOTADA" : "") : "ESCOLHA"}
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {todasAsCores.map(cor => {
                  const v = variacoes.find(x => x.cor === cor);
                  const mini = v?.fotos?.[0];
                  const ativo = corSelecionada === cor;
                  const esgotadaCor = v?.esgotado === true;
                  return (
                    <button key={cor} onClick={() => !esgotadaCor && selecionarCor(cor)}
                      className="relative overflow-hidden rounded-lg transition-all"
                      title={esgotadaCor ? cor + " — Esgotada" : cor}
                      style={{
                        outline: ativo ? "2px solid #5CC800" : esgotadaCor ? "1px solid rgba(255,107,0,0.3)" : "1px solid rgba(92,200,0,0.2)",
                        outlineOffset: "2px",
                        transform: ativo ? "scale(1.06)" : "scale(1)",
                        cursor: esgotadaCor ? "not-allowed" : "pointer",
                        opacity: esgotadaCor ? 0.5 : 1,
                      }}>
                      {mini
                        ? <img src={mini} alt={cor} className="h-9 w-9 object-cover" />
                        : <span className="flex h-7 items-center px-2 text-[10px] font-black"
                            style={{ background: ativo ? "rgba(92,200,0,0.25)" : "#21262D", color: ativo ? "#5CC800" : esgotadaCor ? "#FF6B00" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", textDecoration: esgotadaCor ? "line-through" : "none" }}>
                            {cor.toUpperCase()}
                          </span>
                      }
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tamanhos */}
          {tamanhosAtuais.length > 0 && (
            <div>
              <p className="text-[10px] font-black mb-1.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                TAMANHO: <span style={{ color: tamanhoSelecionado ? "#5CC800" : "#8B949E" }}>
                  {tamanhoSelecionado || "ESCOLHA"}
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tamanhosAtuais.map(t => {
                  const tamEsgotado = variacaoAtual?.tamanhos_esgotados?.includes(t) ?? false;
                  const ativo = tamanhoSelecionado === t;
                  return (
                    <button key={t} onClick={() => !tamEsgotado && setTamanhoSelecionado(ativo ? "" : t)}
                      className="rounded-lg px-2.5 py-1 text-xs font-black transition-all"
                      title={tamEsgotado ? t + " — Esgotado" : t}
                      style={{
                        background: ativo ? "#5CC800" : tamEsgotado ? "rgba(255,107,0,0.08)" : "#21262D",
                        color: ativo ? "#0D1117" : tamEsgotado ? "#FF6B00" : "#8B949E",
                        border: "1px solid " + (ativo ? "#5CC800" : tamEsgotado ? "rgba(255,107,0,0.3)" : "rgba(92,200,0,0.2)"),
                        fontFamily: "'Barlow Condensed', sans-serif",
                        textDecoration: tamEsgotado ? "line-through" : "none",
                        cursor: tamEsgotado ? "not-allowed" : "pointer",
                        opacity: tamEsgotado ? 0.6 : 1,
                      }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mensagem de feedback (acima dos botões) */}
          {feedback === "ok" && (
            <p className="text-xs font-black text-center" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              ✓ ADICIONADO AO CARRINHO
            </p>
          )}
          {feedback === "falta" && (
            <p className="text-xs font-black text-center" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              ⚠ {validarSelecao().motivo?.toUpperCase()}
            </p>
          )}

          {/* Ações: 1 botão grande "adicionar" + 1 ícone "comprar agora" */}
          {!corEsgotada && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleAdicionar({ abrirDrawer: false })}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg,#5CC800,#4aaa00)",
                  color: "#fff",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                🛒 ADICIONAR
              </button>
              <button
                onClick={() => handleAdicionar({ abrirDrawer: true })}
                title="Comprar agora"
                aria-label="Comprar agora"
                className="flex items-center justify-center rounded-xl px-3 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: "rgba(255,184,0,0.12)",
                  color: "#FFB800",
                  border: "1px solid rgba(255,184,0,0.4)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                <span style={{ fontSize: 18 }}>⚡</span>
              </button>
            </div>
          )}
        </div>
      </article>
    </>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function LojaPage(): React.JSX.Element {
  const authSupabase = createClient();

  // Gate de cidade
  const [cidadeConfirmada, setCidadeConfirmada] = useState<boolean | null>(null);
  const [verificandoGate, setVerificandoGate] = useState(true);
  const [registrandoInteresse, setRegistrandoInteresse] = useState(false);
  const [interesseEnviado, setInteresseEnviado] = useState(false);
  const [cidadeInteresse, setCidadeInteresse] = useState("");

  useEffect(() => {
    async function verificarConfig() {
      const { data } = await authSupabase
        .from("app_config")
        .select("valor")
        .eq("chave", "loja_restrita_cidade")
        .single();

      const restrita = data?.valor !== "false";

      if (!restrita) {
        setCidadeConfirmada(true);
        setVerificandoGate(false);
        return;
      }

      const salvo = localStorage.getItem("modarun_cidade_confirmada");
      if (salvo === "sim") setCidadeConfirmada(true);
      else if (salvo === "nao") setCidadeConfirmada(false);
      else setCidadeConfirmada(null);
      setVerificandoGate(false);
    }
    verificarConfig();
  }, []); // eslint-disable-line

  function confirmarCidade(sim: boolean) {
    localStorage.setItem("modarun_cidade_confirmada", sim ? "sim" : "nao");
    setCidadeConfirmada(sim);
  }

  async function registrarInteresse() {
    if (!cidadeInteresse.trim()) return;
    setRegistrandoInteresse(true);
    try {
      await authSupabase.from("sugestoes_eventos").insert({
        nome: "Interesse na loja Moda Run",
        cidade: cidadeInteresse.trim(),
        estado: "",
        observacoes: "Usuário demonstrou interesse na loja para sua cidade.",
      });
    } catch { /* ignora */ }
    setInteresseEnviado(true);
    setRegistrandoInteresse(false);
  }

  // Estado de produtos / banners
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");

  // NOVO: busca textual + ordenação
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<"padrao" | "preco_asc" | "preco_desc" | "nome">("padrao");

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
        authSupabase.from("banners").select("*").eq("ativo", true).or("exibir_loja.is.null,exibir_loja.eq.true").order("ordem").order("criado_em", { ascending: false }),
      ]);
      setProdutos((prods || []).map((p: Record<string, unknown>) => ({ ...p, variacoes_cor: parseVariacoes(p.variacoes_cor) })) as Produto[]);
      setBanners(bans || []);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categoriasDinamicas: string[] = ["Todos", ...Array.from(
    new Set(produtos.map(p => p.categoria).filter(Boolean))
  ).sort()];

  // Filtro categoria + busca + ordenação
  const produtosFiltrados = (() => {
    let lista = categoriaSelecionada === "Todos"
      ? produtos
      : produtos.filter(p => p.categoria === categoriaSelecionada);

    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      lista = lista.filter(p =>
        p.nome.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        (p.descricao || "").toLowerCase().includes(q)
      );
    }

    const precoEfetivo = (p: Produto) => p.preco_promocional && p.preco_promocional < p.preco ? p.preco_promocional : p.preco;
    if (ordenacao === "preco_asc") lista = [...lista].sort((a, b) => precoEfetivo(a) - precoEfetivo(b));
    else if (ordenacao === "preco_desc") lista = [...lista].sort((a, b) => precoEfetivo(b) - precoEfetivo(a));
    else if (ordenacao === "nome") lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return lista;
  })();

  const destaques = produtos.filter(p => p.destaque);

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />

      {/* Drawer + FAB do carrinho */}
      <CarrinhoDrawer />

      {/* GATE: confirmação de cidade */}
      {!verificandoGate && cidadeConfirmada === null && (
        <main className="flex min-h-screen items-center justify-center px-4 py-16"
          style={{ background: "#0D1117" }}>
          <div className="w-full max-w-md text-center space-y-6 animate-slide-up">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
              style={{ background: "linear-gradient(135deg, rgba(92,200,0,0.15), rgba(255,107,0,0.1))", border: "1px solid rgba(92,200,0,0.25)" }}>
              🛒
            </div>
            <div>
              <h1 className="text-3xl font-black mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                VOCÊ ESTÁ EM<br /><span style={{ color: "#5CC800" }}>TUCURUÍ/PA?</span>
              </h1>
              <p className="text-sm" style={{ color: "#8B949E" }}>
                A loja Moda Run realiza entregas apenas em Tucuruí por enquanto.
              </p>
            </div>
            <div className="space-y-3">
              <button onClick={() => confirmarCidade(true)}
                className="w-full rounded-2xl py-4 font-black text-base transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(92,200,0,0.25)" }}>
                ✅ SIM, ESTOU EM TUCURUÍ
              </button>
              <button onClick={() => confirmarCidade(false)}
                className="w-full rounded-2xl py-4 font-black text-base transition-all hover:brightness-110"
                style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                ❌ NÃO ESTOU EM TUCURUÍ
              </button>
            </div>
          </div>
        </main>
      )}

      {/* GATE: fora da área */}
      {cidadeConfirmada === false && (
        <main className="flex min-h-screen items-center justify-center px-4 py-16"
          style={{ background: "#0D1117" }}>
          <div className="w-full max-w-md space-y-6 animate-slide-up">
            <div className="rounded-2xl p-6 text-center"
              style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.2)" }}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ background: "rgba(255,107,0,0.1)" }}>
                📦
              </div>
              <h2 className="text-2xl font-black mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                EM BREVE NA SUA CIDADE!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#8B949E" }}>
                No momento, a loja <strong style={{ color: "#5CC800" }}>Moda Run</strong> atende apenas{" "}
                <strong style={{ color: "#FFB800" }}>Tucuruí/PA</strong>.<br />
                Em breve chegaremos a outras cidades!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://instagram.com/modarun" target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span className="text-2xl">📸</span>
                <span className="font-black text-xs">INSTAGRAM</span>
                <span className="text-xs opacity-80">Acompanhe novidades</span>
              </a>
              <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero consultar disponibilidade para minha cidade."
                target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #25D366, #1ebe5d)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span className="text-2xl">💬</span>
                <span className="font-black text-xs">WHATSAPP</span>
                <span className="text-xs opacity-80">Consultar disponibilidade</span>
              </a>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.2)" }}>
              <p className="font-black text-sm mb-3" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                📍 CADASTRE SUA CIDADE
              </p>
              {interesseEnviado ? (
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.2)" }}>
                  <p className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ✅ Interesse registrado! Avisaremos quando chegarmos aí.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={cidadeInteresse}
                    onChange={e => setCidadeInteresse(e.target.value)}
                    placeholder="Sua cidade/estado"
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ background: "#0D1117", color: "#E6EDF3", border: "1px solid rgba(255,184,0,0.2)" }}
                  />
                  <button
                    onClick={registrarInteresse}
                    disabled={registrandoInteresse || !cidadeInteresse.trim()}
                    className="w-full rounded-xl py-3 font-black text-sm transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#FFB800,#e6a700)", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    {registrandoInteresse ? "ENVIANDO..." : "QUERO SER AVISADO"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* LOJA */}
      {cidadeConfirmada === true && (
        <main className="min-h-screen pb-24" style={{ background: "#0D1117" }}>
          {/* Hero */}
          <section className="px-4 pt-6 pb-4" style={{ background: "#0D1117" }}>
            <div className="mx-auto max-w-6xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mb-2"
                    style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.2)" }}>
                    <span style={{ fontSize: 10 }}>🛒</span>
                    <span className="text-[10px] font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                      MODA RUN STORE
                    </span>
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

              {!loading && banners.length > 0 && <BannerRotativo banners={banners} />}
            </div>
          </section>

          {/* Destaques */}
          {!loading && destaques.length > 0 && categoriaSelecionada === "Todos" && !busca && (
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

          {/* Busca + Categorias + Ordenação */}
          <section className="px-4 py-3 sticky top-[57px] z-40" style={{ background: "rgba(13,17,23,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(92,200,0,0.1)" }}>
            <div className="mx-auto max-w-6xl space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8B949E" }}>🔍</span>
                  <input
                    type="text"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full rounded-xl pl-9 pr-3 py-2 text-sm"
                    style={{ background: "#161B22", color: "#E6EDF3", border: "1px solid rgba(92,200,0,0.15)" }}
                  />
                  {busca && (
                    <button
                      onClick={() => setBusca("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 text-xs"
                      style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00" }}
                      aria-label="Limpar busca"
                    >✕</button>
                  )}
                </div>
                <select
                  value={ordenacao}
                  onChange={e => setOrdenacao(e.target.value as typeof ordenacao)}
                  className="rounded-xl px-2 py-2 text-xs font-black cursor-pointer"
                  style={{ background: "#161B22", color: "#E6EDF3", border: "1px solid rgba(92,200,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
                  aria-label="Ordenar"
                >
                  <option value="padrao">PADRÃO</option>
                  <option value="preco_asc">MENOR PREÇO</option>
                  <option value="preco_desc">MAIOR PREÇO</option>
                  <option value="nome">A → Z</option>
                </select>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {categoriasDinamicas.map(cat => {
                  const count = cat === "Todos" ? produtos.length : produtos.filter(p => p.categoria === cat).length;
                  if (count === 0 && cat !== "Todos") return null;
                  const ativo = categoriaSelecionada === cat;
                  return (
                    <button key={cat} onClick={() => setCategoriaSelecionada(cat)}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all"
                      style={{
                        background: ativo ? "#5CC800" : "rgba(92,200,0,0.08)",
                        color: ativo ? "#0D1117" : "#8B949E",
                        border: ativo ? "1px solid #5CC800" : "1px solid rgba(92,200,0,0.15)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        letterSpacing: "0.05em",
                      }}>
                      <span>{getCatIcon(cat)}</span>
                      <span>{cat.toUpperCase()}</span>
                      {cat !== "Todos" && count > 0 && <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ background: ativo ? "rgba(0,0,0,0.2)" : "rgba(92,200,0,0.15)", color: ativo ? "#0D1117" : "#5CC800" }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Produtos */}
          <section className="px-4 py-8" style={{ background: "#161B22" }}>
            <div className="mx-auto max-w-6xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
                  <h2 className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                    {busca ? `BUSCA: "${busca.toUpperCase()}"` : categoriaSelecionada === "Todos" ? "TODOS OS PRODUTOS" : `${getCatIcon(categoriaSelecionada)} ${categoriaSelecionada.toUpperCase()}`}
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
                  <p className="text-5xl mb-3">{busca ? "🔍" : getCatIcon(categoriaSelecionada)}</p>
                  <p className="font-black text-xl mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                    {busca ? "NADA ENCONTRADO" : categoriaSelecionada === "Todos" ? "PRODUTOS EM BREVE" : `SEM PRODUTOS EM ${categoriaSelecionada.toUpperCase()}`}
                  </p>
                  <p className="text-sm mb-5" style={{ color: "#8B949E" }}>
                    {busca ? "Tente outras palavras ou limpe a busca." : "Fale pelo WhatsApp para ver o catálogo completo."}
                  </p>
                  {busca ? (
                    <button onClick={() => setBusca("")}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm"
                      style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      LIMPAR BUSCA
                    </button>
                  ) : (
                    <a href="https://wa.me/5594920009526" target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm"
                      style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      💬 FALAR NO WHATSAPP
                    </a>
                  )}
                </div>
              )}

              {!loading && produtosFiltrados.length > 0 && (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {produtosFiltrados.map(p => <ProdutoCard key={p.id} produto={p} />)}
                </div>
              )}
            </div>
          </section>

          {/* CTA final */}
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

          {/* FAB do carrinho — sempre visível na loja */}
          <CarrinhoFAB mostrarVazio />
        </main>
      )}
    </>
  );
}
