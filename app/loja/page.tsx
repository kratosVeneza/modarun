"use client";

import React, { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type VariacaoCor = {
  cor: string;
  fotos: string[];
};

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  categoria: string;
  fotos: string[];           // fotos gerais (fallback)
  variacoes_cor: VariacaoCor[]; // fotos por cor
  cores: string[];
  tamanhos: string[];
  estoque_disponivel: boolean;
  destaque: boolean;
  whatsapp_msg?: string;
};

// ─── ProdutoCard ─────────────────────────────────────────────────────────────

function ProdutoCard({ produto }: { produto: Produto }): React.JSX.Element {
  const temVariacoes = produto.variacoes_cor && produto.variacoes_cor.length > 0;
  const primeiraCorComFoto = temVariacoes ? produto.variacoes_cor[0].cor : (produto.cores[0] || "");

  const [corSelecionada, setCorSelecionada] = useState(primeiraCorComFoto);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");

  // Determina as fotos a exibir baseado na cor selecionada
  const fotosAtuais: string[] = (() => {
    if (temVariacoes) {
      const variacao = produto.variacoes_cor.find(v => v.cor === corSelecionada);
      if (variacao && variacao.fotos.length > 0) return variacao.fotos;
    }
    return produto.fotos || [];
  })();

  // Reset foto ao trocar cor
  function selecionarCor(cor: string) {
    setCorSelecionada(cor);
    setFotoAtiva(0);
  }

  const temDesconto = !!produto.preco_promocional && produto.preco_promocional < produto.preco;
  const precoFinal = temDesconto ? produto.preco_promocional! : produto.preco;
  const desconto = temDesconto ? Math.round(100 - (produto.preco_promocional! / produto.preco) * 100) : 0;
  const fmtPreco = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function gerarLinkWhatsApp() {
    let msg = produto.whatsapp_msg || `Olá! Tenho interesse no produto *${produto.nome}* da Moda Run.`;
    if (corSelecionada) msg += `\n\nCor: ${corSelecionada}`;
    if (tamanhoSelecionado) msg += `\nTamanho: ${tamanhoSelecionado}`;
    msg += `\n\nPreço: ${fmtPreco(precoFinal)}`;
    return `https://wa.me/5594920009526?text=${encodeURIComponent(msg)}`;
  }

  // Todas as cores disponíveis (variacoes + cores simples)
  const todasAsCores = temVariacoes
    ? produto.variacoes_cor.map(v => v.cor)
    : produto.cores;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl hover:-translate-y-1">
      {/* Galeria */}
      <div className="relative overflow-hidden bg-slate-100">
        {fotosAtuais.length > 0 ? (
          <>
            <img
              src={fotosAtuais[fotoAtiva]}
              alt={produto.nome}
              className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
            />
            {fotosAtuais.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {fotosAtuais.map((_, i) => (
                    <button key={i} onClick={() => setFotoAtiva(i)}
                      className={`h-2 w-2 rounded-full transition ${i === fotoAtiva ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`} />
                  ))}
                </div>
                <button onClick={() => setFotoAtiva(i => (i - 1 + fotosAtuais.length) % fotosAtuais.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50">‹</button>
                <button onClick={() => setFotoAtiva(i => (i + 1) % fotosAtuais.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50">›</button>
              </>
            )}
          </>
        ) : (
          <div className="flex h-56 items-center justify-center text-5xl text-slate-200">🛍</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">{produto.categoria}</span>
          {produto.destaque && <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">⭐ Destaque</span>}
          {temDesconto && <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm">-{desconto}%</span>}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 leading-tight">{produto.nome}</h3>
          {produto.descricao && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{produto.descricao}</p>}
        </div>

        <div>
          {temDesconto ? (
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-orange-600">{fmtPreco(precoFinal)}</p>
              <p className="text-sm text-slate-400 line-through">{fmtPreco(produto.preco)}</p>
            </div>
          ) : <p className="text-xl font-bold text-orange-600">{fmtPreco(produto.preco)}</p>}
        </div>

        {/* Cores com foto própria */}
        {todasAsCores.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">
              Cor: <span className="text-slate-700">{corSelecionada}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {todasAsCores.map(cor => {
                const variacao = produto.variacoes_cor?.find(v => v.cor === cor);
                const miniFoto = variacao?.fotos?.[0];
                return (
                  <button key={cor} onClick={() => selecionarCor(cor)}
                    className={`relative overflow-hidden rounded-xl transition ${corSelecionada === cor ? "ring-2 ring-orange-500 ring-offset-1" : "ring-1 ring-slate-200 hover:ring-orange-300"}`}>
                    {miniFoto ? (
                      <img src={miniFoto} alt={cor} className="h-10 w-10 object-cover" />
                    ) : (
                      <span className={`flex h-8 items-center px-2.5 text-xs font-semibold ${corSelecionada === cor ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-600"}`}>
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
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Tamanho</p>
            <div className="flex flex-wrap gap-1.5">
              {produto.tamanhos.map(t => (
                <button key={t} onClick={() => setTamanhoSelecionado(tamanhoSelecionado === t ? "" : t)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${tamanhoSelecionado === t ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <a href={gerarLinkWhatsApp()} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-95">
            💬 Comprar no WhatsApp
          </a>
          <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            📸 Ver no Instagram
          </a>
        </div>
      </div>
    </article>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

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
        ...p,
        variacoes_cor: (p.variacoes_cor as VariacaoCor[]) || [],
      })) as Produto[]);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">

          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 p-8 text-white shadow-xl sm:p-12">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="relative max-w-lg">
              <span className="inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wider">Loja Oficial</span>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Corra na moda.<br />Vista-se para vencer.</h1>
              <p className="mt-3 text-sm text-orange-100 sm:text-base">Roupas, calçados e acessórios para corredores de todos os níveis.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver os produtos." target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-md hover:shadow-lg">💬 WhatsApp</a>
                <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">📸 Instagram</a>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Produtos</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? "Carregando..." : `${produtos.length} ${produtos.length === 1 ? "item disponível" : "itens disponíveis"}`}
              </p>
            </div>

            {loading && (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
              </div>
            )}

            {!loading && produtos.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-4xl">🛍</p>
                <p className="mt-3 font-semibold text-slate-700">Produtos em breve</p>
                <a href="https://wa.me/5594920009526" target="_blank" rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">💬 Falar no WhatsApp</a>
              </div>
            )}

            {!loading && produtos.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {produtos.map(produto => <ProdutoCard key={produto.id} produto={produto} />)}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-center">
            <p className="text-base font-bold text-slate-900">Não encontrou o que procura?</p>
            <p className="mt-1 text-sm text-slate-500">Entre em contato e veja o catálogo completo.</p>
            <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver o catálogo completo." target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">
              💬 Falar com a Moda Run
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
