"use client";

import { useState } from "react";

export default function CompartilharTreino({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);

    setTimeout(() => setCopiado(false), 2000);
  }

  async function compartilhar() {
    if (navigator.share) {
      await navigator.share({
        title: "Treino de corrida",
        text: "Participe deste treino comigo",
        url,
      });
      return;
    }

    await copiarLink();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={copiarLink}
        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-orange-600"
      >
        {copiado ? "Link copiado!" : "Copiar link"}
      </button>

      <button
        type="button"
        onClick={compartilhar}
        className="rounded-2xl border border-white px-4 py-2 text-sm font-semibold text-white"
      >
        Compartilhar treino
      </button>
    </div>
  );
}