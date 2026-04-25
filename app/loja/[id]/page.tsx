"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Share2, ChevronLeft, ChevronRight, ZoomIn, X, Star, Tag, Ruler, Package } from "lucide-react";

type VariacaoCor = {
  cor: string; fotos: string[]; tamanhos: string[];
  esgotado?: boolean; tamanhos_esgotados?: string[];
};

type Produto = {
  id: string; nome: string; descricao?: string; preco: number;
  preco_promocional?: number; categoria: string;
  fotos: string[]; variacoes_cor: unknown;
  cores: string[]; tamanhos: string[];
  estoque_disponivel: boolean; destaque: boolean;
  whatsapp_msg?: string; quantidade?: number | null;
};

function parseVariacoes(raw: unknown): VariacaoCor[] {
  if (!raw) return [];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  if (Array.isArray(raw)) return raw as VariacaoCor[];
  return [];
}

function formatarPreco(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ModalFoto({ fotos, indice, onClose }: { fotos: string[]; indice: number; onClose: () => void }) {
  const [atual, setAtual] = useState(indice);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setAtual(i => (i - 1 + fotos.length) % fotos.length);
      if (e.key === "ArrowRight") setAtual(i => (i + 1) % fotos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fotos.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(16px)" }}
      onClick={onClose}>
      <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-1.5 font-black text-sm"
          style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
          <X size={16} strokeWidth={2} /> FECHAR
        </button>
        {fotos.length > 1 && (
          <button onClick={() => setAtual(i => (i - 1 + fotos.length) % fotos.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
        )}
        <img src={fotos[atual]} alt="" className="w-full rounded-2xl object-contain max-h-[80vh]" />
        {fotos.length > 1 && (
          <button onClick={() => setAtual(i => (i + 1) % fotos.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <ChevronRight size={20} color="#fff" />
          </button>
        )}
        {fotos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {fotos.map((_, i) => (
              <button key={i} onClick={() => setAtual(i)}
                className="rounded-full transition-all"
                style={{ width: i === atual ? "20px" : "8px", height: "8px", background: i === atual ? "#5CC800" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProdutoPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params?.id as string;

  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [corSelecionada, setCorSelecionada] = useState<string | null>(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email);
      if (user?.email) {
        supabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single()
          .then(({ data }) => setIsAdmin(!!data));
      }
    });
    const { data } = await supabase.from("produtos").select("*").eq("id", id).single();
    if (data) setProduto(data as Produto);
    setLoading(false);
  }, [id]); // eslint-disable-line

  useEffect(() => { carregar(); }, [carregar]);

  if (loading) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
      </main>
    </>
  );

  if (!produto) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "#0D1117" }}>
        <p className="text-2xl font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>PRODUTO NÃO ENCONTRADO</p>
        <Link href="/loja" className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm"
          style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
          <ArrowLeft size={16} strokeWidth={2} /> VOLTAR À LOJA
        </Link>
      </main>
    </>
  );

  const variacoes = parseVariacoes(produto.variacoes_cor);
  const temVariacoes = variacoes.length > 0;
  const variacaoAtual = variacoes.find(v => v.cor === corSelecionada);
  const fotosAtuais = corSelecionada && variacaoAtual?.fotos?.length
    ? variacaoAtual.fotos
    : produto.fotos?.length ? produto.fotos : variacoes[0]?.fotos || [];
  const tamanhosAtuais = variacaoAtual?.tamanhos?.length ? variacaoAtual.tamanhos : produto.tamanhos || [];
  const corEsgotada = variacaoAtual?.esgotado === true;

  const precoFinal = produto.preco_promocional || produto.preco;
  const temDesconto = !!produto.preco_promocional && produto.preco_promocional < produto.preco;
  const desconto = temDesconto ? Math.round((1 - produto.preco_promocional! / produto.preco) * 100) : 0;

  function montarMsgWhatsapp() {
    const base = `Olá! Tenho interesse no produto *${produto!.nome}*`;
    const cor = corSelecionada ? `\nCor: *${corSelecionada}*` : "";
    const tam = tamanhoSelecionado ? `\nTamanho: *${tamanhoSelecionado}*` : "";
    const preco = `\nValor: *${formatarPreco(precoFinal)}*`;
    const link = `\n\n🔗 Página do produto:\n${window.location.href}`;
    const foto = fotosAtuais[fotoAtiva] ? `\n\n🖼 Foto:\n${fotosAtuais[fotoAtiva]}` : "";
    return produto!.whatsapp_msg || (base + cor + tam + preco + foto + link);
  }

  function abrirWhatsapp() {
    const numero = process.env.NEXT_PUBLIC_WHATSAPP_ORGANIZADOR || "5594920009526";
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(montarMsgWhatsapp())}`, "_blank");
  }

  async function compartilhar() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: produto!.nome, url }); return; } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Breadcrumb */}
        <div className="px-4 py-4 mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs" style={{ color: "#8B949E" }}>
            <Link href="/loja" className="flex items-center gap-1 hover:text-green-400 transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              <ShoppingBag size={12} strokeWidth={2} /> LOJA
            </Link>
            <span>/</span>
            <span style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{produto.nome.toUpperCase()}</span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

            {/* ── GALERIA ─────────────────────────────────────────────── */}
            <div className="space-y-3">
              {/* Foto principal */}
              <div className="relative overflow-hidden rounded-2xl cursor-zoom-in group"
                style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)", aspectRatio: "1" }}
                onClick={() => fotosAtuais.length > 0 && setModalAberto(true)}>

                {fotosAtuais.length > 0 ? (
                  <img key={`${corSelecionada}-${fotoAtiva}`}
                    src={fotosAtuais[fotoAtiva]} alt={produto.nome}
                    className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    style={{ opacity: corEsgotada ? 0.4 : 1 }} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag size={64} color="rgba(92,200,0,0.15)" strokeWidth={1} />
                  </div>
                )}

                {corEsgotada && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="rounded-xl px-5 py-2.5 font-black text-base rotate-[-12deg]"
                      style={{ background: "rgba(255,107,0,0.9)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                      🚫 ESGOTADO
                    </div>
                  </div>
                )}

                {fotosAtuais.length > 0 && !corEsgotada && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <ZoomIn size={12} strokeWidth={2} /> AMPLIAR
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {produto.destaque && (
                    <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black"
                      style={{ background: "rgba(255,184,0,0.9)", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      <Star size={10} strokeWidth={0} fill="#0D1117" /> DESTAQUE
                    </span>
                  )}
                  {temDesconto && (
                    <span className="rounded-lg px-2.5 py-1 text-xs font-black"
                      style={{ background: "rgba(92,200,0,0.9)", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      -{desconto}%
                    </span>
                  )}
                </div>

                {/* Navegação de fotos */}
                {fotosAtuais.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setFotoAtiva(i => (i - 1 + fotosAtuais.length) % fotosAtuais.length); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <ChevronLeft size={16} color="#fff" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setFotoAtiva(i => (i + 1) % fotosAtuais.length); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <ChevronRight size={16} color="#fff" />
                    </button>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              {fotosAtuais.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {fotosAtuais.map((foto, i) => (
                    <button key={i} onClick={() => setFotoAtiva(i)}
                      className="shrink-0 overflow-hidden rounded-xl transition-all hover:scale-105"
                      style={{ width: "72px", height: "72px", border: `2px solid ${i === fotoAtiva ? "#5CC800" : "transparent"}`, background: "#161B22" }}>
                      <img src={foto} alt="" className="h-full w-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── INFO PRODUTO ─────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Categoria + nome */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-xs font-black rounded-lg px-2.5 py-1"
                    style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                    <Tag size={10} strokeWidth={2} /> {produto.categoria.toUpperCase()}
                  </span>
                  {!produto.estoque_disponivel && (
                    <span className="text-xs font-black rounded-lg px-2.5 py-1"
                      style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      FORA DE ESTOQUE
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black leading-tight"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                  {produto.nome}
                </h1>
              </div>

              {/* Preço */}
              <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.12)" }}>
                {temDesconto && (
                  <p className="text-sm line-through mb-0.5" style={{ color: "#8B949E" }}>
                    {formatarPreco(produto.preco)}
                  </p>
                )}
                <p className="text-4xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: temDesconto ? "#5CC800" : "#E6EDF3" }}>
                  {formatarPreco(precoFinal)}
                </p>
                {temDesconto && (
                  <p className="text-xs font-black mt-1" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Você economiza {formatarPreco(produto.preco - precoFinal)} ({desconto}% off)
                  </p>
                )}
              </div>

              {/* Cores */}
              {temVariacoes && (
                <div>
                  <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                    COR: <span style={{ color: corSelecionada ? (corEsgotada ? "#FF6B00" : "#5CC800") : "#8B949E" }}>
                      {corSelecionada ? `${corSelecionada}${corEsgotada ? " — ESGOTADO" : ""}` : "Selecione"}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variacoes.map(v => {
                      const esgotada = v.esgotado === true;
                      const ativo = corSelecionada === v.cor;
                      return (
                        <button key={v.cor}
                          onClick={() => { if (!esgotada) { setCorSelecionada(prev => prev === v.cor ? null : v.cor); setFotoAtiva(0); setTamanhoSelecionado(""); } }}
                          className="relative overflow-hidden rounded-xl transition-all hover:scale-105"
                          style={{ outline: ativo ? "2px solid #5CC800" : esgotada ? "1px solid rgba(255,107,0,0.3)" : "1px solid rgba(92,200,0,0.2)", outlineOffset: "2px", opacity: esgotada ? 0.5 : 1, cursor: esgotada ? "not-allowed" : "pointer" }}
                          title={v.cor + (esgotada ? " — Esgotado" : "")}>
                          {v.fotos?.[0]
                            ? <img src={v.fotos[0]} alt={v.cor} className="h-14 w-14 object-cover" />
                            : <span className="flex h-10 items-center px-4 text-xs font-black"
                                style={{ background: ativo ? "rgba(92,200,0,0.2)" : "#21262D", color: ativo ? "#5CC800" : esgotada ? "#FF6B00" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {v.cor}
                              </span>
                          }
                          {esgotada && (
                            <div className="absolute inset-0 flex items-end justify-center pb-0.5"
                              style={{ background: "rgba(0,0,0,0.4)" }}>
                              <span className="text-xs font-black px-1 rounded"
                                style={{ background: "rgba(255,107,0,0.9)", color: "#fff", fontSize: "9px", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                ESGOT.
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tamanhos */}
              {tamanhosAtuais.length > 0 && (
                <div>
                  <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                    TAMANHO: <span style={{ color: tamanhoSelecionado ? "#5CC800" : "#8B949E" }}>{tamanhoSelecionado || "Selecione"}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tamanhosAtuais.map(t => {
                      const esgotado = variacaoAtual?.tamanhos_esgotados?.includes(t) ?? false;
                      const ativo = tamanhoSelecionado === t;
                      return (
                        <button key={t}
                          onClick={() => !esgotado && setTamanhoSelecionado(ativo ? "" : t)}
                          className="rounded-xl px-4 py-2 text-sm font-black transition-all"
                          style={{
                            background: ativo ? "#5CC800" : esgotado ? "rgba(255,107,0,0.08)" : "#21262D",
                            color: ativo ? "#0D1117" : esgotado ? "#FF6B00" : "#8B949E",
                            border: "1px solid " + (ativo ? "#5CC800" : esgotado ? "rgba(255,107,0,0.3)" : "rgba(92,200,0,0.2)"),
                            textDecoration: esgotado ? "line-through" : "none",
                            cursor: esgotado ? "not-allowed" : "pointer",
                            fontFamily: "'Barlow Condensed', sans-serif",
                          }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA compra */}
              <div className="space-y-2">
                <button onClick={abrirWhatsapp}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-base transition-all hover:brightness-110 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #25D366, #1ebe5d)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", boxShadow: "0 4px 24px rgba(37,211,102,0.25)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  COMPRAR PELO WHATSAPP
                </button>
                <button onClick={compartilhar}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-sm transition-all hover:brightness-110"
                  style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.25)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  <Share2 size={15} strokeWidth={2} />
                  {copiado ? "✓ LINK COPIADO!" : "COMPARTILHAR PRODUTO"}
                </button>
              </div>

              {/* Descrição */}
              {produto.descricao && (
                <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                  <p className="text-xs font-black mb-3 flex items-center gap-1.5"
                    style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                    <Package size={13} strokeWidth={2} /> DESCRIÇÃO DO PRODUTO
                  </p>
                  <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#C9D1D9" }}>
                    {produto.descricao}
                  </div>
                </div>
              )}

              {/* Detalhes */}
              <div className="rounded-2xl p-5 space-y-2" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                <p className="text-xs font-black mb-3 flex items-center gap-1.5"
                  style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                  <Ruler size={13} strokeWidth={2} /> DETALHES
                </p>
                {[
                  { l: "CATEGORIA", v: produto.categoria },
                  { l: "CORES DISPONÍVEIS", v: temVariacoes ? variacoes.filter(v => !v.esgotado).map(v => v.cor).join(", ") || "—" : (produto.cores?.join(", ") || "—") },
                  { l: "TAMANHOS", v: tamanhosAtuais.length > 0 ? tamanhosAtuais.join(", ") : "Único" },
                  { l: "ESTOQUE", v: produto.estoque_disponivel ? "Disponível" : "Indisponível" },
                ].map(d => (
                  <div key={d.l} className="flex justify-between text-xs py-1.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>{d.l}</span>
                    <span style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>{d.v}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Voltar à loja */}
          <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link href="/loja" className="flex items-center gap-2 text-sm font-black transition-all hover:opacity-70"
              style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              <ArrowLeft size={16} strokeWidth={2} /> VOLTAR À LOJA
            </Link>
          </div>
        </div>

        {/* Modal foto ampliada */}
        {modalAberto && fotosAtuais.length > 0 && (
          <ModalFoto fotos={fotosAtuais} indice={fotoAtiva} onClose={() => setModalAberto(false)} />
        )}
      </main>
    </>
  );
}
