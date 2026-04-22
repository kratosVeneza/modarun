"use client";
import { useState } from "react";

export default function CompartilharTreino({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    try { await navigator.clipboard.writeText(url); }
    catch { const i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select(); document.execCommand("copy"); document.body.removeChild(i); }
    setCopiado(true); setTimeout(() => setCopiado(false), 2500);
  }

  async function compartilhar() {
    if (navigator.share) { try { await navigator.share({ title: "Treino de corrida — Moda Run", text: "Participe deste treino comigo! 🏃", url }); return; } catch {} }
    await copiarLink();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copiarLink} className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${copiado ? "bg-emerald-500 text-white" : "bg-white text-orange-600 hover:bg-orange-50"}`}>
        {copiado ? "✓ Copiado!" : "🔗 Copiar link"}
      </button>
      <button type="button" onClick={compartilhar} className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
        📤 Compartilhar
      </button>
    </div>
  );
}
