"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const estados = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function FiltroEventos({ cidadeInicial, estadoInicial }: { cidadeInicial: string; estadoInicial: string }): React.JSX.Element {
  const router = useRouter();
  const [cidade, setCidade] = useState(cidadeInicial);
  const [estado, setEstado] = useState(estadoInicial);

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (cidade.trim()) params.set("cidade", cidade.trim());
    if (estado) params.set("estado", estado);
    const qs = params.toString();
    router.push(qs ? `/eventos?${qs}` : "/eventos");
  }

  const temFiltro = !!(cidadeInicial || estadoInicial);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🔍</span>
        <h2 className="text-base font-bold text-slate-900">Filtrar eventos</h2>
        {temFiltro && <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">Filtro ativo</span>}
      </div>
      <form onSubmit={aplicar} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="text" placeholder="Cidade (ex: São Paulo)" value={cidade} onChange={(e) => setCidade(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100" />
        <select value={estado} onChange={(e) => setEstado(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white sm:w-40">
          <option value="">Estado</option>
          {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
        </select>
        <div className="flex shrink-0 gap-2">
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700">Buscar</button>
          {temFiltro && <button type="button" onClick={() => { setCidade(""); setEstado(""); router.push("/eventos"); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Limpar</button>}
        </div>
      </form>
    </div>
  );
}
