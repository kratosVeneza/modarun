"use client";
/**
 * CarrinhoContext — Estado global do carrinho da Moda Run.
 *
 * Decisões:
 *  • Itens são identificados por (produto_id + cor + tamanho). Mesmo produto em
 *    cor/tamanho diferentes vira linha separada.
 *  • Persistência: localStorage. Sobrevive a reload, não polui o backend.
 *  • Checkout: gera UMA mensagem de WhatsApp consolidada (sem gateway de pagamento).
 *  • Sem dependências externas — só Context API.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ItemCarrinho = {
  /** chave única do item: `${produto_id}|${cor||""}|${tamanho||""}` */
  key: string;
  produto_id: string;
  nome: string;
  categoria: string;
  preco_unitario: number; // já considerando promoção, se houver
  preco_original?: number; // se !== preco_unitario, mostrar desconto
  cor?: string;
  tamanho?: string;
  foto?: string;
  quantidade: number;
};

type CarrinhoState = {
  itens: ItemCarrinho[];
  /** controla abertura do drawer */
  aberto: boolean;
};

type CarrinhoContextValue = CarrinhoState & {
  abrir: () => void;
  fechar: () => void;
  alternar: () => void;
  adicionar: (item: Omit<ItemCarrinho, "key" | "quantidade">, qtd?: number) => void;
  remover: (key: string) => void;
  atualizarQuantidade: (key: string, qtd: number) => void;
  limpar: () => void;
  /** total de itens (somando quantidades) */
  totalItens: number;
  /** subtotal em centavos para evitar problemas de ponto flutuante? Não — preços em real. */
  subtotal: number;
  /** desconto total (preco_original - preco_unitario por item, se houver) */
  desconto: number;
  /** gera link de WhatsApp consolidado */
  gerarLinkWhatsApp: (numero: string, urlOrigem?: string) => string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "modarun_carrinho_v1";

function montarKey(produto_id: string, cor?: string, tamanho?: string): string {
  return `${produto_id}|${cor || ""}|${tamanho || ""}`;
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [aberto, setAberto] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  // Hidratar do localStorage (só no client, depois do mount)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItens(parsed);
      }
    } catch {
      // localStorage indisponível ou corrompido — começa vazio
    }
    setHidratado(true);
  }, []);

  // Persistir mudanças (só depois de hidratar, pra não sobrescrever com array vazio)
  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    } catch {
      // quota cheia ou modo privado — segue funcionando em memória
    }
  }, [itens, hidratado]);

  const abrir = useCallback(() => setAberto(true), []);
  const fechar = useCallback(() => setAberto(false), []);
  const alternar = useCallback(() => setAberto((v) => !v), []);

  const adicionar = useCallback(
    (item: Omit<ItemCarrinho, "key" | "quantidade">, qtd: number = 1) => {
      const key = montarKey(item.produto_id, item.cor, item.tamanho);
      setItens((prev) => {
        const idx = prev.findIndex((i) => i.key === key);
        if (idx >= 0) {
          // já existe — incrementa
          const novo = [...prev];
          novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade + qtd };
          return novo;
        }
        return [...prev, { ...item, key, quantidade: qtd }];
      });
    },
    []
  );

  const remover = useCallback((key: string) => {
    setItens((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const atualizarQuantidade = useCallback((key: string, qtd: number) => {
    setItens((prev) => {
      if (qtd <= 0) return prev.filter((i) => i.key !== key);
      return prev.map((i) => (i.key === key ? { ...i, quantidade: qtd } : i));
    });
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const totalItens = useMemo(
    () => itens.reduce((acc, i) => acc + i.quantidade, 0),
    [itens]
  );

  const subtotal = useMemo(
    () => itens.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0),
    [itens]
  );

  const desconto = useMemo(
    () =>
      itens.reduce((acc, i) => {
        if (i.preco_original && i.preco_original > i.preco_unitario) {
          return acc + (i.preco_original - i.preco_unitario) * i.quantidade;
        }
        return acc;
      }, 0),
    [itens]
  );

  const gerarLinkWhatsApp = useCallback(
    (numero: string, urlOrigem?: string): string => {
      if (itens.length === 0) return `https://wa.me/${numero}`;
      const linhas: string[] = [];
      linhas.push("*🛒 PEDIDO MODA RUN*");
      linhas.push("");
      itens.forEach((item, idx) => {
        linhas.push(`*${idx + 1}. ${item.nome}*`);
        if (item.cor) linhas.push(`   • Cor: ${item.cor}`);
        if (item.tamanho) linhas.push(`   • Tamanho: ${item.tamanho}`);
        linhas.push(
          `   • Quantidade: ${item.quantidade} × ${fmtBRL(item.preco_unitario)} = *${fmtBRL(
            item.preco_unitario * item.quantidade
          )}*`
        );
        if (item.foto) linhas.push(`   🖼 ${item.foto}`);
        linhas.push("");
      });
      if (desconto > 0) {
        linhas.push(`Subtotal sem desconto: ${fmtBRL(subtotal + desconto)}`);
        linhas.push(`Desconto: -${fmtBRL(desconto)}`);
      }
      linhas.push(`*TOTAL: ${fmtBRL(subtotal)}*`);
      linhas.push("");
      linhas.push(`📦 Itens: ${totalItens}`);
      if (urlOrigem) {
        linhas.push("");
        linhas.push(`🔗 Origem: ${urlOrigem}`);
      }
      return `https://wa.me/${numero}?text=${encodeURIComponent(linhas.join("\n"))}`;
    },
    [itens, subtotal, desconto, totalItens]
  );

  const value: CarrinhoContextValue = {
    itens,
    aberto,
    abrir,
    fechar,
    alternar,
    adicionar,
    remover,
    atualizarQuantidade,
    limpar,
    totalItens,
    subtotal,
    desconto,
    gerarLinkWhatsApp,
  };

  return <CarrinhoContext.Provider value={value}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho(): CarrinhoContextValue {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) {
    throw new Error("useCarrinho deve ser usado dentro de <CarrinhoProvider>");
  }
  return ctx;
}
