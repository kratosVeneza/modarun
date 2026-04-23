"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MapaTreinoEditor = dynamic(() => import("@/components/MapaTreinoEditor"), { ssr: false });

type LatLng = { lat: number; lng: number };

const tiposTreino = ["Caminhada longa","Corrida leve","Corrida moderada","Longão","Tiro","Fartlek","Intervalado","Regenerativo","Subida","Trail","Outro"];
const estadosBR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://modarun.vercel.app";

const inp = { background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"12px 16px", fontSize:"14px", outline:"none", width:"100%", transition:"border-color 0.2s" } as React.CSSProperties;
const lbl = { display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" } as React.CSSProperties;

export default function EncontroForm(): React.JSX.Element {
  const router = useRouter();
  const [etapa, setEtapa] = useState(1);
  const [form, setForm] = useState({ titulo:"",cidade:"",estado:"",data_encontro:"",horario:"",local_saida:"",percurso:"",ritmo:"",observacoes:"",organizador_nome:"",tipo_treino:"",km_planejado:"" });
  const [pontoEncontro, setPontoEncontro] = useState<LatLng|null>(null);
  const [rotaCoords, setRotaCoords] = useState<LatLng[]>([]);
  const [distanciaReal, setDistanciaReal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [treinoId, setTreinoId] = useState<number|null>(null);
  const [copiado, setCopiado] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function avancarEtapa() {
    if (!form.titulo || !form.cidade || !form.estado || !form.data_encontro || !form.horario || !form.local_saida) {
      setErro("Preencha: título, cidade, estado, data, horário e ponto de encontro."); return;
    }
    setErro(""); setEtapa(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErro("");
    try {
      const res = await fetch("/api/encontros", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, distancia: distanciaReal > 0 ? `${distanciaReal.toFixed(2)} km` : null, ponto_encontro_lat: pontoEncontro?.lat ?? null, ponto_encontro_lng: pontoEncontro?.lng ?? null, rota_coords: rotaCoords }),
      });
      const result = await res.json();
      if (!res.ok) { setErro(result.error || "Erro ao criar treino."); setLoading(false); return; }
      setTreinoId(result.data?.id || result.id);
      setForm({ titulo:"",cidade:"",estado:"",data_encontro:"",horario:"",local_saida:"",percurso:"",ritmo:"",observacoes:"",organizador_nome:"",tipo_treino:"",km_planejado:"" });
      setPontoEncontro(null); setRotaCoords([]); setDistanciaReal(0); setEtapa(1);
      setTimeout(() => router.refresh(), 100);
    } catch { setErro("Erro ao enviar os dados."); }
    finally { setLoading(false); }
  }

  async function copiarLink() {
    const url = `${SITE_URL}/treinos/${treinoId}/publico`;
    try { await navigator.clipboard.writeText(url); } catch { const i=document.createElement("input");i.value=url;document.body.appendChild(i);i.select();document.execCommand("copy");document.body.removeChild(i); }
    setCopiado(true); setTimeout(() => setCopiado(false), 3000);
  }

  // ── PAINEL DE SUCESSO ─────────────────────────────────────────────────────
  if (treinoId) {
    const linkPublico = `${SITE_URL}/treinos/${treinoId}/publico`;
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(92,200,0,0.3)" }}>
        <div className="relative overflow-hidden px-5 py-8 text-center" style={{ background: "linear-gradient(135deg, #1a3a0a, #0f2106)" }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: "rgba(92,200,0,0.2)", border: "2px solid #5CC800" }}>🎉</div>
          <h3 className="text-2xl font-black" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#5CC800" }}>TREINO CRIADO!</h3>
          <p className="mt-1 text-sm" style={{ color:"rgba(92,200,0,0.7)" }}>Compartilhe com seus amigos e grupos</p>
        </div>
        <div className="p-5 space-y-3" style={{ background:"#161B22" }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background:"#21262D", border:"1px solid rgba(92,200,0,0.2)" }}>
            <span className="flex-1 text-xs truncate" style={{ color:"#8B949E" }}>{linkPublico}</span>
            <button type="button" onClick={copiarLink} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black"
              style={{ background: copiado?"#5CC800":"rgba(92,200,0,0.15)", color: copiado?"#0D1117":"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>
              {copiado?"✓ COPIADO":"COPIAR"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { const msg=`🏃 *Treino de corrida marcado!*\n\nVem correr comigo!\n👉 ${linkPublico}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank"); }}
              className="flex items-center justify-center gap-2 rounded-xl py-4 font-black text-sm"
              style={{ background:"linear-gradient(135deg,#25D366,#1ebe5d)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif" }}>
              <span className="text-xl">💬</span> WHATSAPP
            </button>
            <button type="button" onClick={async()=>{ if(navigator.share){try{await navigator.share({title:"Treino Moda Run 🏃",text:"Participe do meu treino!",url:linkPublico});return;}catch{}} await copiarLink(); }}
              className="flex items-center justify-center gap-2 rounded-xl py-4 font-black text-sm"
              style={{ background:"rgba(92,200,0,0.15)", color:"#5CC800", border:"1px solid rgba(92,200,0,0.3)", fontFamily:"'Barlow Condensed', sans-serif" }}>
              <span className="text-xl">📤</span> COMPARTILHAR
            </button>
          </div>
          <p className="text-xs text-center" style={{ color:"#8B949E" }}>Quem receber o link pode confirmar presença sem criar conta</p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setTreinoId(null); setCopiado(false); }} className="flex-1 rounded-xl py-3 text-sm font-black"
              style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>
              + CRIAR OUTRO
            </button>
            <a href={`/treinos/${treinoId}`} className="flex-1 flex items-center justify-center rounded-xl py-3 text-sm font-black"
              style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif" }}>
              VER TREINO →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── FORMULÁRIO ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.15)" }}>
      {/* Indicador de etapas */}
      <div className="flex" style={{ borderBottom:"1px solid rgba(92,200,0,0.1)" }}>
        {[{n:1,l:"INFORMAÇÕES"},{n:2,l:"MAPA"}].map(e => (
          <div key={e.n} className="flex-1 flex items-center justify-center gap-2 py-3 transition-all"
            style={{ background: etapa===e.n?"rgba(92,200,0,0.1)":"transparent", borderBottom: etapa===e.n?"2px solid #5CC800":"2px solid transparent" }}>
            <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black"
              style={{ background: etapa===e.n?"#5CC800":etapa>e.n?"rgba(92,200,0,0.3)":"rgba(255,255,255,0.05)", color: etapa===e.n?"#0D1117":"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>
              {etapa>e.n?"✓":e.n}
            </div>
            <span className="text-xs font-black hidden sm:block" style={{ color:etapa===e.n?"#5CC800":"#8B949E", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>{e.l}</span>
          </div>
        ))}
      </div>

      <div className="p-5">
        {/* ETAPA 1 */}
        {etapa===1 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-1 rounded-full" style={{ background:"#5CC800" }} />
                <h2 className="font-black text-lg" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>DETALHES DO TREINO</h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label style={lbl}>TÍTULO *</label>
                <input name="titulo" type="text" placeholder="Ex: Corrida matinal no parque" value={form.titulo} onChange={handleChange} style={inp}
                  onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
              </div>
              <div>
                <label style={lbl}>SEU NOME</label>
                <input name="organizador_nome" type="text" placeholder="Organizador" value={form.organizador_nome} onChange={handleChange} style={inp}
                  onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label style={lbl}>CIDADE *</label>
                <input name="cidade" type="text" placeholder="Ex: Tucuruí" value={form.cidade} onChange={handleChange} style={inp}
                  onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
              </div>
              <div>
                <label style={lbl}>ESTADO *</label>
                <select name="estado" value={form.estado} onChange={handleChange} style={inp}>
                  <option value="">Selecione</option>
                  {estadosBR.map(uf=><option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-2">
              <div>
                <label style={lbl}>DATA *</label>
                <input name="data_encontro" type="date" value={form.data_encontro} onChange={handleChange} style={inp} />
              </div>
              <div>
                <label style={lbl}>HORÁRIO *</label>
                <input name="horario" type="time" value={form.horario} onChange={handleChange} style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>PONTO DE ENCONTRO *</label>
              <input name="local_saida" type="text" placeholder="Ex: Entrada do Parque Municipal" value={form.local_saida} onChange={handleChange} style={inp}
                onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label style={lbl}>TIPO DE TREINO</label>
                <select name="tipo_treino" value={form.tipo_treino} onChange={handleChange} style={inp}>
                  <option value="">Selecione</option>
                  {tiposTreino.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>KM PLANEJADO</label>
                <input name="km_planejado" type="number" placeholder="Ex: 10" value={form.km_planejado} onChange={handleChange} style={inp}
                  onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label style={lbl}>RITMO</label>
                <input name="ritmo" type="text" placeholder="Ex: leve, moderado" value={form.ritmo} onChange={handleChange} style={inp}
                  onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
              </div>
              <div>
                <label style={lbl}>PERCURSO</label>
                <input name="percurso" type="text" placeholder="Descrição do percurso" value={form.percurso} onChange={handleChange} style={inp}
                  onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
              </div>
            </div>
            <div>
              <label style={lbl}>OBSERVAÇÕES</label>
              <textarea name="observacoes" placeholder="Informações extras para os participantes..." value={form.observacoes} onChange={handleChange} rows={2}
                style={{...inp, resize:"none"}} onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
            </div>
            {erro && <div className="rounded-xl p-3 text-sm font-semibold" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", border:"1px solid rgba(255,107,0,0.2)" }}>{erro}</div>}
            <button type="button" onClick={avancarEtapa}
              className="w-full rounded-xl py-4 text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em", boxShadow:"0 4px 20px rgba(92,200,0,0.25)" }}>
              PRÓXIMO: MARCAR NO MAPA →
            </button>
          </div>
        )}

        {/* ETAPA 2 */}
        {etapa===2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full" style={{ background:"#FF6B00" }} />
                  <h2 className="font-black text-lg" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>MARCAR NO MAPA</h2>
                </div>
                <button type="button" onClick={() => { setEtapa(1); setErro(""); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-black"
                  style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>
                  ← VOLTAR
                </button>
              </div>
            </div>

            {/* Resumo da etapa 1 */}
            <div className="rounded-xl p-3" style={{ background:"rgba(92,200,0,0.05)", border:"1px solid rgba(92,200,0,0.15)" }}>
              <p className="text-xs font-black mb-1" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em" }}>📋 RESUMO</p>
              <p className="text-sm font-bold" style={{ color:"#E6EDF3" }}>{form.titulo}</p>
              <p className="text-xs" style={{ color:"#8B949E" }}>📍 {form.local_saida} · {form.cidade}/{form.estado} · {form.data_encontro} às {form.horario}</p>
            </div>

            {(pontoEncontro || rotaCoords.length>0) && (
              <div className="rounded-xl p-3" style={{ background:"rgba(92,200,0,0.05)", border:"1px solid rgba(92,200,0,0.15)" }}>
                {pontoEncontro && <p className="text-xs font-semibold" style={{ color:"#5CC800" }}>📍 Ponto marcado: {pontoEncontro.lat.toFixed(4)}, {pontoEncontro.lng.toFixed(4)}</p>}
                {rotaCoords.length>0 && <p className="text-xs font-semibold" style={{ color:"#FF6B00" }}>🗺 {rotaCoords.length} pontos de rota</p>}
                {distanciaReal>0 && <p className="text-xs font-black" style={{ color:"#5CC800" }}>⚡ {distanciaReal.toFixed(2)} km traçados</p>}
              </div>
            )}

            <MapaTreinoEditor
              pontoEncontro={pontoEncontro} setPontoEncontro={setPontoEncontro}
              rotaCoords={rotaCoords} setRotaCoords={setRotaCoords}
              onDistanciaChange={setDistanciaReal} />

            {erro && <div className="rounded-xl p-3 text-sm font-semibold" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", border:"1px solid rgba(255,107,0,0.2)" }}>{erro}</div>}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-4 text-base font-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em", boxShadow:"0 4px 20px rgba(92,200,0,0.25)" }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  CRIANDO TREINO...
                </span>
              ) : "⚡ CRIAR TREINO"}
            </button>
            <p className="text-center text-xs" style={{ color:"#8B949E" }}>O mapa é opcional — você pode criar sem marcar</p>
          </form>
        )}
      </div>
    </div>
  );
}
