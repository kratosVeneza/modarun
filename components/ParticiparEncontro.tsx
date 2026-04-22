"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParticiparEncontro({ encontroId }: { encontroId: number }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMensagem("");
    if (!nome.trim()) { setMensagem("Informe seu nome."); setLoading(false); return; }
    try {
      const res = await fetch("/api/participar-encontro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ encontro_id: encontroId, nome: nome.trim(), whatsapp }) });
      const result = await res.json();
      if (!res.ok) { setMensagem(result.error || "Erro ao participar."); setLoading(false); return; }
      setSucesso(true);
      setMensagem("Participação confirmada! 🎉");
      setTimeout(() => router.refresh(), 300);
      if (result.whatsappLink) setTimeout(() => window.open(result.whatsappLink, "_blank"), 800);
      setTimeout(() => { setAberto(false); setMensagem(""); setSucesso(false); setNome(""); setWhatsapp(""); }, 2200);
    } catch { setMensagem("Erro de conexão. Tente novamente."); }
    finally { setLoading(false); }
  }

  function fechar() { setAberto(false); setMensagem(""); setSucesso(false); setNome(""); setWhatsapp(""); }

  return (
    <>
      <button onClick={() => setAberto(true)} className="shrink-0 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95">Participar</button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && fechar()}>
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirmar participação</h3>
                <p className="mt-0.5 text-xs text-slate-500">Após confirmar, o organizador será notificado pelo WhatsApp.</p>
              </div>
              <button onClick={fechar} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={enviar} className="space-y-4 p-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nome *</label>
                <input type="text" placeholder="Como você quer ser chamado" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp <span className="normal-case font-normal text-slate-400">(opcional)</span></label>
                <input type="tel" placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100" />
              </div>
              {mensagem && (
                <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${sucesso ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {mensagem}
                  {sucesso && <p className="mt-1 text-xs opacity-70">Abrindo WhatsApp para notificar o organizador...</p>}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={fechar} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={loading || sucesso} className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Enviando...</span> : sucesso ? "✓ Confirmado!" : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
