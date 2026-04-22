"use client";

import React, { useState } from "react";

type Produto = {
  id: string; nome: string; descricao?: string; preco: number;
  preco_promocional?: number; categoria: string; fotos: string[];
  cores: string[]; tamanhos: string[]; destaque: boolean; whatsapp_msg?: string;
};

function ProdutoCard({ produto }: { produto: Produto }): React.JSX.Element {
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [corSelecionada, setCorSelecionada] = useState(produto.cores[0] || "");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");

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

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl hover:-translate-y-1">
      <div className="relative overflow-hidden bg-slate-100">
        {produto.fotos.length > 0 ? (
          <>
            <img src={produto.fotos[fotoAtiva]} alt={produto.nome} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"/>
            {produto.fotos.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {produto.fotos.map((_, i) => (
                    <button key={i} onClick={() => setFotoAtiva(i)} className={`h-2 w-2 rounded-full transition ${i === fotoAtiva ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`}/>
                  ))}
                </div>
                <button onClick={() => setFotoAtiva(i => (i - 1 + produto.fotos.length) % produto.fotos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50">‹</button>
                <button onClick={() => setFotoAtiva(i => (i + 1) % produto.fotos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50">›</button>
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
        {produto.cores.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Cor</p>
            <div className="flex flex-wrap gap-1.5">
              {produto.cores.map(cor => (
                <button key={cor} onClick={() => setCorSelecionada(cor)} className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${corSelecionada === cor ? "bg-orange-500 text-white" : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300"}`}>{cor}</button>
              ))}
            </div>
          </div>
        )}
        {produto.tamanhos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Tamanho</p>
            <div className="flex flex-wrap gap-1.5">
              {produto.tamanhos.map(t => (
                <button key={t} onClick={() => setTamanhoSelecionado(tamanhoSelecionado === t ? "" : t)} className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${tamanhoSelecionado === t ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:border-slate-400"}`}>{t}</button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2 pt-1">
          <a href={gerarLinkWhatsApp()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-95">💬 Comprar no WhatsApp</a>
          <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">📸 Ver no Instagram</a>
        </div>
      </div>
    </article>
  );
}

export default function LojaClient({ produtos }: { produtos: Produto[] }): React.JSX.Element {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {produtos.map((produto) => <ProdutoCard key={produto.id} produto={produto} />)}
    </div>
  );
}
