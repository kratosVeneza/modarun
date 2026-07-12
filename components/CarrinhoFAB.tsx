"use client";
/**
 * CarrinhoFAB — botão flutuante de carrinho.
 *
 * Aparece no canto inferior direito sempre que houver itens (ou quando
 * o usuário está navegando em páginas de loja). Badge mostra a contagem
 * e tem um pulso quando muda — feedback visual do "adicionei".
 */

import React, { useEffect, useRef } from "react";
import { useCarrinho } from "@/contexts/CarrinhoContext";

export default function CarrinhoFAB({
  /** Se true, mostra o FAB mesmo com carrinho vazio (útil em /loja). */
  mostrarVazio = false,
}: {
  mostrarVazio?: boolean;
}): React.JSX.Element | null {
  const { totalItens, abrir, aberto } = useCarrinho();
  const btnRef = useRef<HTMLButtonElement>(null);
  const prevTotalRef = useRef<number>(totalItens);

  // Pulso quando o total aumenta
  useEffect(() => {
    if (totalItens > prevTotalRef.current && btnRef.current) {
      const el = btnRef.current;
      el.classList.remove("modarun-cart-pulse");
      // força reflow pra reiniciar a animação
      void el.offsetWidth;
      el.classList.add("modarun-cart-pulse");
    }
    prevTotalRef.current = totalItens;
  }, [totalItens]);

  if (aberto) return null; // sumir enquanto drawer está aberto
  if (totalItens === 0 && !mostrarVazio) return null;

  return (
    <>
      <style>{`
        @keyframes modarun-cart-pulse-kf {
          0%   { transform: scale(1); }
          25%  { transform: scale(1.18); }
          50%  { transform: scale(0.94); }
          100% { transform: scale(1); }
        }
        .modarun-cart-pulse {
          animation: modarun-cart-pulse-kf 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modarun-cart-glow-kf {
          0%, 100% { box-shadow: 0 6px 24px rgba(92,200,0,0.35), 0 0 0 0 rgba(92,200,0,0.4); }
          50%      { box-shadow: 0 6px 24px rgba(92,200,0,0.55), 0 0 0 8px rgba(92,200,0,0); }
        }
        .modarun-cart-glow {
          animation: modarun-cart-glow-kf 2.4s ease-in-out infinite;
        }
      `}</style>
      <button
        ref={btnRef}
        onClick={abrir}
        aria-label={`Abrir carrinho (${totalItens} ${totalItens === 1 ? "item" : "itens"})`}
        className={`fixed z-[80] flex items-center gap-2 rounded-full font-black transition-all hover:brightness-110 active:scale-95 ${totalItens > 0 ? "modarun-cart-glow" : ""}`}
        style={{
          right: 16,
          bottom: 20,
          padding: "14px 20px 14px 18px",
          background: "linear-gradient(135deg,#5CC800,#4aaa00)",
          color: "#0D1117",
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "0.04em",
          boxShadow: "0 6px 24px rgba(92,200,0,0.35)",
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>🛒</span>
        <span className="hidden sm:inline" style={{ fontSize: 14 }}>
          CARRINHO
        </span>
        {totalItens > 0 && (
          <span
            className="ml-1 flex items-center justify-center rounded-full"
            style={{
              minWidth: 24,
              height: 24,
              padding: "0 7px",
              background: "#0D1117",
              color: "#5CC800",
              fontSize: 13,
              fontWeight: 900,
              border: "2px solid #fff",
            }}
          >
            {totalItens}
          </span>
        )}
      </button>
    </>
  );
}
