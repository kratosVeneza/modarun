"use client";
/**
 * CarrinhoDrawer — painel lateral (desktop) / bottom-sheet (mobile) do carrinho.
 *
 * Visual: mantém a paleta Moda Run (#0D1117 / #161B22 / #5CC800 / #FF6B00)
 * e a tipografia Barlow Condensed nos títulos/labels.
 *
 * Observação: trava o scroll do body quando aberto e fecha com ESC.
 */

import React, { useEffect } from "react";
import { useCarrinho } from "@/contexts/CarrinhoContext";

const WPP_NUM = process.env.NEXT_PUBLIC_WHATSAPP_ORGANIZADOR || "5594920009526";

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CarrinhoDrawer(): React.JSX.Element | null {
  const {
    itens,
    aberto,
    fechar,
    remover,
    atualizarQuantidade,
    limpar,
    totalItens,
    subtotal,
    desconto,
    gerarLinkWhatsApp,
  } = useCarrinho();

  // Trava scroll + ESC pra fechar
  useEffect(() => {
    if (!aberto) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto, fechar]);

  if (!aberto) return null;

  const urlOrigem = typeof window !== "undefined" ? window.location.href : undefined;
  const linkWpp = gerarLinkWhatsApp(WPP_NUM, urlOrigem);
  const vazio = itens.length === 0;

  return (
    <div
      className="fixed inset-0 z-[90] flex"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={fechar}
      role="dialog"
      aria-label="Carrinho de compras"
      aria-modal="true"
    >
      {/* Spacer (desktop) — clique aqui fecha */}
      <div className="hidden sm:block flex-1" />

      {/* Painel */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full sm:max-w-md flex-col"
        style={{
          background: "#0D1117",
          borderLeft: "1px solid rgba(92,200,0,0.2)",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Faixa de cor superior (assinatura visual Moda Run) */}
        <div
          className="h-1 w-full shrink-0"
          style={{ background: "linear-gradient(90deg,#5CC800,#FF6B00,#FFB800)" }}
        />

        {/* Header */}
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: "#161B22",
            borderBottom: "1px solid rgba(92,200,0,0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
              style={{
                background: "rgba(92,200,0,0.12)",
                border: "1px solid rgba(92,200,0,0.25)",
              }}
            >
              🛒
            </div>
            <div>
              <h2
                className="text-xl font-black leading-none"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: "#E6EDF3",
                  letterSpacing: "0.03em",
                }}
              >
                MEU CARRINHO
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: "#8B949E" }}>
                {totalItens === 0
                  ? "Nenhum item ainda"
                  : `${totalItens} ${totalItens === 1 ? "item" : "itens"}`}
              </p>
            </div>
          </div>
          <button
            onClick={fechar}
            aria-label="Fechar carrinho"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black transition-all hover:brightness-125"
            style={{
              background: "rgba(255,107,0,0.1)",
              color: "#FF6B00",
              border: "1px solid rgba(255,107,0,0.3)",
            }}
          >
            ✕
          </button>
        </header>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {vazio ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center py-16">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl text-5xl"
                style={{
                  background: "rgba(92,200,0,0.08)",
                  border: "1px dashed rgba(92,200,0,0.25)",
                }}
              >
                🛍
              </div>
              <div>
                <p
                  className="text-xl font-black"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: "#E6EDF3",
                    letterSpacing: "0.02em",
                  }}
                >
                  CARRINHO VAZIO
                </p>
                <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>
                  Escolha os produtos na loja para adicionar aqui.
                </p>
              </div>
              <button
                onClick={fechar}
                className="rounded-xl px-5 py-2.5 text-sm font-black transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg,#5CC800,#4aaa00)",
                  color: "#fff",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                CONTINUAR COMPRANDO
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {itens.map((item) => (
                <li
                  key={item.key}
                  className="flex gap-3 overflow-hidden rounded-2xl p-3"
                  style={{
                    background: "#161B22",
                    border: "1px solid rgba(92,200,0,0.12)",
                  }}
                >
                  {/* Foto */}
                  <div
                    className="shrink-0 overflow-hidden rounded-xl"
                    style={{
                      background: "#21262D",
                      width: 80,
                      height: 80,
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {item.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.foto}
                        alt={item.nome}
                        className="h-full w-full"
                        style={{ objectFit: "contain", padding: 4 }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        📷
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="text-[10px] font-black"
                          style={{
                            color: "#8B949E",
                            fontFamily: "'Barlow Condensed', sans-serif",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {item.categoria.toUpperCase()}
                        </p>
                        <p
                          className="font-black leading-tight truncate"
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            color: "#E6EDF3",
                            fontSize: 15,
                          }}
                          title={item.nome}
                        >
                          {item.nome}
                        </p>
                      </div>
                      <button
                        onClick={() => remover(item.key)}
                        aria-label={`Remover ${item.nome}`}
                        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-all hover:brightness-125"
                        style={{
                          background: "rgba(255,107,0,0.08)",
                          color: "#FF6B00",
                          border: "1px solid rgba(255,107,0,0.2)",
                        }}
                      >
                        🗑
                      </button>
                    </div>

                    {/* Atributos */}
                    {(item.cor || item.tamanho) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.cor && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-black"
                            style={{
                              background: "rgba(92,200,0,0.1)",
                              color: "#5CC800",
                              fontFamily: "'Barlow Condensed', sans-serif",
                              letterSpacing: "0.05em",
                            }}
                          >
                            COR: {item.cor.toUpperCase()}
                          </span>
                        )}
                        {item.tamanho && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-black"
                            style={{
                              background: "rgba(255,184,0,0.1)",
                              color: "#FFB800",
                              fontFamily: "'Barlow Condensed', sans-serif",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {item.tamanho.toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quantidade + preço */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div
                        className="inline-flex items-center rounded-lg overflow-hidden"
                        style={{ border: "1px solid rgba(92,200,0,0.2)" }}
                      >
                        <button
                          onClick={() =>
                            atualizarQuantidade(item.key, item.quantidade - 1)
                          }
                          aria-label="Diminuir quantidade"
                          className="flex h-7 w-7 items-center justify-center text-sm font-black transition hover:brightness-125"
                          style={{
                            background: "rgba(92,200,0,0.08)",
                            color: "#5CC800",
                          }}
                        >
                          −
                        </button>
                        <span
                          className="flex h-7 w-8 items-center justify-center text-xs font-black"
                          style={{
                            background: "#0D1117",
                            color: "#E6EDF3",
                            fontFamily: "'Barlow Condensed', sans-serif",
                          }}
                        >
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() =>
                            atualizarQuantidade(item.key, item.quantidade + 1)
                          }
                          aria-label="Aumentar quantidade"
                          className="flex h-7 w-7 items-center justify-center text-sm font-black transition hover:brightness-125"
                          style={{
                            background: "rgba(92,200,0,0.08)",
                            color: "#5CC800",
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        {item.preco_original &&
                          item.preco_original > item.preco_unitario && (
                            <p
                              className="text-[10px] line-through"
                              style={{ color: "#8B949E" }}
                            >
                              {fmtBRL(item.preco_original * item.quantidade)}
                            </p>
                          )}
                        <p
                          className="font-black"
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            color: "#5CC800",
                            fontSize: 16,
                          }}
                        >
                          {fmtBRL(item.preco_unitario * item.quantidade)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer (totais + checkout) */}
        {!vazio && (
          <footer
            className="px-5 py-4 space-y-3"
            style={{
              background: "#161B22",
              borderTop: "1px solid rgba(92,200,0,0.15)",
            }}
          >
            {desconto > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#8B949E" }}>Desconto aplicado</span>
                <span
                  className="font-black"
                  style={{
                    color: "#FF6B00",
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                >
                  −{fmtBRL(desconto)}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span
                className="text-sm font-black"
                style={{
                  color: "#8B949E",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.08em",
                }}
              >
                TOTAL
              </span>
              <span
                className="text-3xl font-black"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: "#5CC800",
                  letterSpacing: "0.01em",
                }}
              >
                {fmtBRL(subtotal)}
              </span>
            </div>

            <a
              href={linkWpp}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg,#5CC800,#4aaa00)",
                color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.05em",
                boxShadow: "0 4px 20px rgba(92,200,0,0.25)",
              }}
            >
              💬 FINALIZAR PEDIDO NO WHATSAPP
            </a>

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={limpar}
                className="font-black transition hover:brightness-125"
                style={{
                  color: "#FF6B00",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                LIMPAR CARRINHO
              </button>
              <button
                onClick={fechar}
                className="font-black transition hover:brightness-125"
                style={{
                  color: "#8B949E",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                CONTINUAR COMPRANDO →
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
