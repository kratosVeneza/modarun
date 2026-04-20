"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FiltroEncontros({
  cidadeInicial,
}: {
  cidadeInicial: string;
}) {
  const router = useRouter();
  const [cidade, setCidade] = useState(cidadeInicial);

  function aplicarFiltro(e: React.FormEvent) {
    e.preventDefault();

    const cidadeLimpa = cidade.trim();

    if (!cidadeLimpa) {
      router.push("/encontros");
      return;
    }

    router.push(`/encontros?cidade=${encodeURIComponent(cidadeLimpa)}`);
  }

  function limparFiltro() {
    setCidade("");
    router.push("/encontros");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Filtrar encontros</h2>
        <p className="mt-1 text-sm text-slate-500">
          Busque encontros por cidade.
        </p>
      </div>

      <form
        onSubmit={aplicarFiltro}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          placeholder="Digite a cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Filtrar
          </button>

          <button
            type="button"
            onClick={limparFiltro}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
}