"use client";
import React, { useState } from "react";

export default function CompartilharTreino({ url }: { url: string }): React.JSX.Element {
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    try { await navigator.clipboard.writeText(url); }
    catch { const i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select(); document.execCommand("copy"); document.body.removeChild(i); }
    setCopiado(true); setTimeout(() => setCopiado(false), 2500);
  }

  async function compartilhar() {
    if (navigator.share) { try { await navigator.share({ title: "Treino Moda Run", text: "Participe deste treino comigo! 🏃", url }); return; } catch {} }
    await copiarLink();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copiarLink}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all hover:scale-105"
        style={{ background: copiado ? "#5CC800" : "rgba(92,200,0,0.15)", color: copiado ? "#0D1117" : "#5CC800", border: "1px solid rgba(92,200,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
        {copiado ? "✓ COPIADO!" : "🔗 COPIAR LINK"}
      </button>
      <button type="button" onClick={compartilhar}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all hover:scale-105"
        style={{ background: "rgba(255,255,255,0.05)", color: "#E6EDF3", border: "1px solid rgba(255,255,255,0.15)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
        📤 COMPARTILHAR
      </button>
    </div>
  );
}
