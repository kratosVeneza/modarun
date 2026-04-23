"use client";

import React, { useState } from "react";
import Link from "next/link";

const estadosBR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function SugerirEventoPage(): React.JSX.Element {
  const [form, setForm] = useState({
    nome: "", cidade: "", estado: "", data_evento: "",
    distancia: "", local: "", link_inscricao: "",
    organizador_nome: "", organizador_whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const inp = {
    background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3",
    borderRadius: "12px", padding: "12px 16px", fontSize: "14px", outline: "none", width: "100%",
  } as React.CSSProperties;
  const lbl = {
    display: "block", fontSize: "11px", fontWeight: 700, color: "#8B949E",
    marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em",
  } as React.CSSProperties;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.cidade || !form.estado || !form.data_evento) {
      setErro("Preencha nome, cidade, estado e data."); return;
    }
    setLoading(true); setErro("");
    const res = await fetch("/api/sugerir-evento", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(result.error || "Erro ao enviar."); return; }
    setEnviado(true);
  }

  if (enviado) return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D1117" }}>
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
          style={{ background: "rgba(92,200,0,0.15)", border: "2px solid #5CC800" }}>🎉</div>
        <h2 className="text-3xl font-black mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>SUGESTÃO ENVIADA!</h2>
        <p className="text-sm mb-6" style={{ color: "#8B949E" }}>Obrigado! Vamos analisar e publicar em breve.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/eventos" className="rounded-xl px-5 py-3 text-sm font-black"
            style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
            VER EVENTOS
          </Link>
          <button onClick={() => { setEnviado(false); setForm({ nome:"",cidade:"",estado:"",data_evento:"",distancia:"",local:"",link_inscricao:"",organizador_nome:"",organizador_whatsapp:"" }); }}
            className="rounded-xl px-5 py-3 text-sm font-black"
            style={{ border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
            SUGERIR OUTRO
          </button>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "#0D1117" }}>
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm"
              style={{ background: "linear-gradient(135deg,#5CC800,#FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>MR</div>
            <span className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>MODA <span style={{ color: "#FF6B00" }}>RUN</span></span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
            style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)" }}>
            <span className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>🏁 SUGERIR EVENTO</span>
          </div>
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
            CONHECE UMA<br /><span style={{ color: "#5CC800" }}>CORRIDA INCRÍVEL?</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>Compartilhe com a comunidade Moda Run!</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg,#5CC800,#FF6B00)" }} />

          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label style={lbl}>NOME DO EVENTO *</label>
              <input type="text" placeholder="Ex: Maratona de São Paulo 2026" value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })} style={inp}
                onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={lbl}>CIDADE *</label>
                <input type="text" placeholder="Ex: São Paulo" value={form.cidade}
                  onChange={e => setForm({ ...form, cidade: e.target.value })} style={inp}
                  onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
              </div>
              <div>
                <label style={lbl}>ESTADO *</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={inp}>
                  <option value="">UF</option>
                  {estadosBR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={lbl}>DATA *</label>
                <input type="date" value={form.data_evento}
                  onChange={e => setForm({ ...form, data_evento: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>DISTÂNCIA</label>
                <input type="text" placeholder="Ex: 5km, 10km, 21km" value={form.distancia}
                  onChange={e => setForm({ ...form, distancia: e.target.value })} style={inp}
                  onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
              </div>
            </div>

            <div>
              <label style={lbl}>LOCAL / ENDEREÇO</label>
              <input type="text" placeholder="Ex: Parque do Ibirapuera" value={form.local}
                onChange={e => setForm({ ...form, local: e.target.value })} style={inp}
                onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
            </div>

            <div>
              <label style={lbl}>LINK DE INSCRIÇÃO</label>
              <input type="url" placeholder="https://..." value={form.link_inscricao}
                onChange={e => setForm({ ...form, link_inscricao: e.target.value })} style={inp}
                onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
            </div>

            <div style={{ borderTop: "1px solid rgba(92,200,0,0.1)", paddingTop: "12px" }}>
              <p className="text-xs font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                SEUS DADOS (OPCIONAL)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={lbl}>SEU NOME</label>
                  <input type="text" placeholder="Ex: João Silva" value={form.organizador_nome}
                    onChange={e => setForm({ ...form, organizador_nome: e.target.value })} style={inp}
                    onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
                </div>
                <div>
                  <label style={lbl}>WHATSAPP</label>
                  <input type="tel" placeholder="(00) 00000-0000" value={form.organizador_whatsapp}
                    onChange={e => setForm({ ...form, organizador_whatsapp: e.target.value })} style={inp}
                    onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
                </div>
              </div>
            </div>

            {erro && <div className="rounded-xl p-3 text-sm font-semibold" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)" }}>{erro}</div>}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-4 text-base font-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ENVIANDO...
                </span>
              ) : "🏁 ENVIAR SUGESTÃO"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "#8B949E" }}>
          Sua sugestão será analisada antes de ser publicada.
        </p>
      </div>
    </main>
  );
}
