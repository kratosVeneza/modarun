"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BotaoExcluirMeusEncontros({ encontroId, titulo }: { encontroId: number; titulo: string }): JSX.Element {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function excluir() {
    setLoading(true); setErro("");
    try {
      const res = await fetch("/api/deletar-encontro", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ encontroId }) });
      const result = await res.json();
      if (!res.ok) { setErro(result.error || "Erro ao excluir."); setLoading(false); return; }
      router.refresh();
    } catch { setErro("Erro de conexão."); setLoading(false); }
  }

  if (confirmando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setConfirmando(false)}>
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">🗑️</div>
          <h3 className="mt-3 text-lg font-bold text-slate-900">Excluir treino?</h3>
          <p className="mt-1 text-sm text-slate-500">O treino <span className="font-semibold">"{titulo}"</span> e todos os participantes serão removidos permanentemente.</p>
          {erro && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}
          <div className="mt-5 flex gap-3">
            <button onClick={() => { setConfirmando(false); setErro(""); }} disabled={loading} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
            <button onClick={excluir} disabled={loading} className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">{loading ? "Excluindo..." : "Sim, excluir"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirmando(true)} className="flex items-center gap-1.5 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
      🗑️ Excluir
    </button>
  );
}
