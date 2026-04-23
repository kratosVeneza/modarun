"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParticiparEncontro({ encontroId }: { encontroId: number }): React.JSX.Element {
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
      setSucesso(true); setMensagem("Participação confirmada! 🎉");
      setTimeout(() => router.refresh(), 300);
      setTimeout(() => { setAberto(false); setMensagem(""); setSucesso(false); setNome(""); setWhatsapp(""); }, 2200);
    } catch { setMensagem("Erro de conexão."); }
    finally { setLoading(false); }
  }

  const inp = { background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", outline: "none", width: "100%" } as React.CSSProperties;
  const lbl = { display: "block", fontSize: "11px", fontWeight: 700, color: "#8B949E", marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" } as React.CSSProperties;

  return (
    <>
      <button onClick={() => setAberto(true)}
        className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-black transition-all hover:brightness-110 hover:scale-105"
        style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
        ⚡ PARTICIPAR
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && setAberto(false)}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(92,200,0,0.1)" }}>
              <div>
                <h3 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>CONFIRMAR PRESENÇA</h3>
                <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>O organizador será notificado pelo WhatsApp.</p>
              </div>
              <button onClick={() => setAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>✕</button>
            </div>
            <form onSubmit={enviar} className="space-y-4 p-6">
              <div><label style={lbl}>NOME *</label><input type="text" placeholder="Como você quer ser chamado" value={nome} onChange={e => setNome(e.target.value)} autoFocus style={inp} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} /></div>
              <div><label style={lbl}>WHATSAPP <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label><input type="tel" placeholder="(00) 00000-0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={inp} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} /></div>
              {mensagem && (
                <div className="rounded-xl p-3 text-sm font-semibold" style={{ background: sucesso ? "rgba(92,200,0,0.1)" : "rgba(255,107,0,0.1)", color: sucesso ? "#5CC800" : "#FF6B00", border: `1px solid ${sucesso ? "rgba(92,200,0,0.3)" : "rgba(255,107,0,0.3)"}` }}>
                  {mensagem}
                  {sucesso && <p className="mt-1 text-xs opacity-70">Abrindo WhatsApp para notificar...</p>}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAberto(false)} className="flex-1 rounded-xl py-3 text-sm font-black" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>CANCELAR</button>
                <button type="submit" disabled={loading || sucesso} className="flex-1 rounded-xl py-3 text-sm font-black disabled:opacity-60 transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {loading ? "ENVIANDO..." : sucesso ? "✓ CONFIRMADO!" : "CONFIRMAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
