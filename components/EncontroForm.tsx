"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MapaTreinoEditor = dynamic(() => import("@/components/MapaTreinoEditor"), { ssr: false });

type LatLng = { lat: number; lng: number };

const tiposTreino = ["Caminhada longa","Corrida leve","Corrida moderada","Longão","Tiro","Fartlek","Intervalado","Regenerativo","Subida","Trail","Outro"];
const estadosBR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://modarun.vercel.app";

const inp = {
  background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3",
  borderRadius: "12px", padding: "12px 16px", fontSize: "14px", outline: "none",
  width: "100%", transition: "border-color 0.2s",
} as React.CSSProperties;

const lbl = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "#8B949E",
  marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em",
} as React.CSSProperties;

export default function EncontroForm(): React.JSX.Element {
  const router = useRouter();

  const [form, setForm] = useState({
    titulo: "", cidade: "", estado: "", data_encontro: "", horario: "",
    local_saida: "", percurso: "", ritmo: "", observacoes: "",
    organizador_nome: "", tipo_treino: "", km_planejado: "",
  });

  const [pontoEncontro, setPontoEncontro] = useState<LatLng | null>(null);
  const [rotaCoords, setRotaCoords] = useState<LatLng[]>([]);
  const [distanciaReal, setDistanciaReal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Sucesso — link do treino criado
  const [treinoId, setTreinoId] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.cidade || !form.estado || !form.data_encontro || !form.horario || !form.local_saida) {
      setErro("Preencha: título, cidade, estado, data, horário e ponto de encontro.");
      return;
    }
    setLoading(true); setErro("");

    try {
      const res = await fetch("/api/encontros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          distancia: distanciaReal > 0 ? `${distanciaReal.toFixed(2)} km` : null,
          ponto_encontro_lat: pontoEncontro?.lat ?? null,
          ponto_encontro_lng: pontoEncontro?.lng ?? null,
          rota_coords: rotaCoords,
        }),
      });

      const result = await res.json();
      if (!res.ok) { setErro(result.error || "Erro ao criar treino."); setLoading(false); return; }

      // Salva ID do treino criado para mostrar painel de compartilhamento
      setTreinoId(result.data?.id || result.id);
      setForm({ titulo:"",cidade:"",estado:"",data_encontro:"",horario:"",local_saida:"",percurso:"",ritmo:"",observacoes:"",organizador_nome:"",tipo_treino:"",km_planejado:"" });
      setPontoEncontro(null); setRotaCoords([]); setDistanciaReal(0);
      setTimeout(() => router.refresh(), 100);
    } catch {
      setErro("Erro ao enviar os dados.");
    } finally {
      setLoading(false);
    }
  }

  async function copiarLink() {
    const url = `${SITE_URL}/treinos/${treinoId}/publico`;
    try { await navigator.clipboard.writeText(url); }
    catch { const i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select(); document.execCommand("copy"); document.body.removeChild(i); }
    setCopiado(true); setTimeout(() => setCopiado(false), 3000);
  }

  function compartilharWhatsApp() {
    const url = `${SITE_URL}/treinos/${treinoId}/publico`;
    const msg = `🏃 *Treino de corrida marcado!*\n\nVem correr comigo!\n👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function novoTreino() {
    setTreinoId(null); setCopiado(false);
  }

  // ── PAINEL DE SUCESSO / COMPARTILHAMENTO ──────────────────────────────────
  if (treinoId) {
    const linkPublico = `${SITE_URL}/treinos/${treinoId}/publico`;
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(92,200,0,0.3)" }}>
        {/* Topo verde */}
        <div className="relative overflow-hidden px-5 py-8 text-center" style={{ background: "linear-gradient(135deg, #1a3a0a, #0f2106)" }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
              style={{ background: "rgba(92,200,0,0.2)", border: "2px solid #5CC800" }}>
              🎉
            </div>
            <h3 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800", letterSpacing: "0.02em" }}>
              TREINO CRIADO!
            </h3>
            <p className="mt-1 text-sm" style={{ color: "rgba(92,200,0,0.7)" }}>
              Agora compartilhe com seus amigos e grupos
            </p>
          </div>
        </div>

        {/* Link do treino */}
        <div className="p-5 space-y-3" style={{ background: "#161B22" }}>
          <p className="text-xs font-black text-center" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
            🔗 LINK DO TREINO
          </p>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.2)" }}>
            <span className="flex-1 text-xs truncate" style={{ color: "#8B949E" }}>{linkPublico}</span>
            <button onClick={copiarLink}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition-all"
              style={{ background: copiado ? "#5CC800" : "rgba(92,200,0,0.15)", color: copiado ? "#0D1117" : "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {copiado ? "✓ COPIADO" : "COPIAR"}
            </button>
          </div>

          {/* Botões de compartilhamento */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={compartilharWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl py-4 font-black text-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #25D366, #1ebe5d)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              <span className="text-xl">💬</span>
              <span>WHATSAPP</span>
            </button>
            <button onClick={async () => {
              if (navigator.share) {
                try { await navigator.share({ title: "Treino Moda Run 🏃", text: "Participe do meu treino!", url: linkPublico }); return; } catch {}
              }
              await copiarLink();
            }}
              className="flex items-center justify-center gap-2 rounded-xl py-4 font-black text-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              <span className="text-xl">📤</span>
              <span>COMPARTILHAR</span>
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: "#8B949E" }}>
            Quem receber o link pode confirmar presença sem precisar criar conta
          </p>

          <div className="flex gap-3 pt-1">
            <button onClick={novoTreino}
              className="flex-1 rounded-xl py-3 text-sm font-black"
              style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              + CRIAR OUTRO
            </button>
            <a href={`/treinos/${treinoId}`}
              className="flex-1 flex items-center justify-center rounded-xl py-3 text-sm font-black transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              VER TREINO →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── FORMULÁRIO ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>CRIAR TREINO</h2>
        </div>
        <p className="text-sm ml-4" style={{ color: "#8B949E" }}>Defina os detalhes e marque o ponto no mapa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Linha 1: Título + Organizador */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label style={lbl}>TÍTULO DO TREINO *</label>
            <input name="titulo" type="text" placeholder="Ex: Corrida matinal no parque" value={form.titulo} onChange={handleChange} style={inp}
              onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
          </div>
          <div>
            <label style={lbl}>SEU NOME</label>
            <input name="organizador_nome" type="text" placeholder="Organizador" value={form.organizador_nome} onChange={handleChange} style={inp}
              onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
          </div>
        </div>

        {/* Linha 2: Cidade + Estado */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label style={lbl}>CIDADE *</label>
            <input name="cidade" type="text" placeholder="Ex: Tucuruí" value={form.cidade} onChange={handleChange} style={inp}
              onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
          </div>
          <div>
            <label style={lbl}>ESTADO *</label>
            <select name="estado" value={form.estado} onChange={handleChange} style={inp}>
              <option value="">Selecione</option>
              {estadosBR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>

        {/* Linha 3: Data + Horário */}
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

        {/* Linha 4: Tipo + KM */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label style={lbl}>TIPO DE TREINO</label>
            <select name="tipo_treino" value={form.tipo_treino} onChange={handleChange} style={inp}>
              <option value="">Selecione</option>
              {tiposTreino.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>KM PLANEJADO</label>
            <input name="km_planejado" type="number" placeholder="Ex: 10" value={form.km_planejado} onChange={handleChange} style={inp}
              onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
          </div>
        </div>

        {/* Ponto de encontro */}
        <div>
          <label style={lbl}>PONTO DE ENCONTRO</label>
          <input name="local_saida" type="text" placeholder="Ex: Entrada do Parque Municipal" value={form.local_saida} onChange={handleChange} style={inp}
            onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
        </div>

        {/* Ritmo + Percurso em grid no mobile só empilha */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label style={lbl}>RITMO</label>
            <input name="ritmo" type="text" placeholder="Ex: leve, moderado, forte" value={form.ritmo} onChange={handleChange} style={inp}
              onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
          </div>
          <div>
            <label style={lbl}>PERCURSO</label>
            <input name="percurso" type="text" placeholder="Descrição do percurso" value={form.percurso} onChange={handleChange} style={inp}
              onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label style={lbl}>OBSERVAÇÕES</label>
          <textarea name="observacoes" placeholder="Informações extras para os participantes..." value={form.observacoes} onChange={handleChange} rows={3}
            style={{ ...inp, resize: "none" }} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
        </div>

        {/* Info do mapa */}
        {(pontoEncontro || rotaCoords.length > 0) && (
          <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(92,200,0,0.05)", border: "1px solid rgba(92,200,0,0.15)" }}>
            {pontoEncontro && <p className="text-xs font-semibold" style={{ color: "#5CC800" }}>📍 Ponto marcado: {pontoEncontro.lat.toFixed(4)}, {pontoEncontro.lng.toFixed(4)}</p>}
            {rotaCoords.length > 0 && <p className="text-xs font-semibold" style={{ color: "#5CC800" }}>🗺 Pontos de rota: {rotaCoords.length}</p>}
            {distanciaReal > 0 && <p className="text-xs font-black" style={{ color: "#5CC800" }}>⚡ Distância: {distanciaReal.toFixed(2)} km</p>}
          </div>
        )}

        {/* Mapa */}
        <MapaTreinoEditor
          pontoEncontro={pontoEncontro}
          setPontoEncontro={setPontoEncontro}
          rotaCoords={rotaCoords}
          setRotaCoords={setRotaCoords}
          onDistanciaChange={setDistanciaReal}
        />

        {erro && (
          <div className="rounded-xl p-3 text-sm font-semibold" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)" }}>
            {erro}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl py-4 text-base font-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(92,200,0,0.25)" }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              CRIANDO TREINO...
            </span>
          ) : "⚡ CRIAR TREINO"}
        </button>
      </form>
    </div>
  );
}
