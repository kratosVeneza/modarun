"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Registro = {
  id: number;
  data: string;
  tipo: string;
  distancia_km?: number;
  duracao_min?: number;
  pace_medio?: string;
  fc_media?: number;
  fc_max?: number;
  elevacao_m?: number;
  calorias?: number;
  notas?: string;
};

const inp = {
  background: "#21262D",
  border: "1px solid rgba(92,200,0,0.2)",
  color: "#E6EDF3",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 600,
} as React.CSSProperties;

const lbl = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "#8B949E",
  marginBottom: "5px",
  fontFamily: "'Barlow Condensed', sans-serif",
  letterSpacing: "0.1em",
} as React.CSSProperties;

const TIPOS = ["Corrida", "Corrida leve", "Longão", "Tiro", "Fartlek", "Intervalado", "Trail", "Caminhada", "Outro"];

function MiniBarChart({ dados, campo, cor, label }: { dados: Registro[]; campo: keyof Registro; cor: string; label: string }) {
  const valores = dados.slice(-12).map(d => Number(d[campo]) || 0);
  const max = Math.max(...valores, 0.1);
  return (
    <div>
      <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{label}</p>
      <div className="flex items-end gap-1" style={{ height: "60px" }}>
        {valores.map((v, i) => (
          <div key={i} className="flex-1 rounded-t transition-all" title={String(v)}
            style={{ height: `${(v / max) * 100}%`, background: cor, opacity: i === valores.length - 1 ? 1 : 0.4 + (i / valores.length) * 0.4, minHeight: v > 0 ? "3px" : "0" }} />
        ))}
      </div>
    </div>
  );
}

function SparkLine({ dados, campo, cor }: { dados: Registro[]; campo: keyof Registro; cor: string }) {
  const valores = dados.slice(-8).map(d => Number(d[campo]) || 0);
  if (valores.every(v => v === 0)) return null;
  const max = Math.max(...valores);
  const min = Math.min(...valores.filter(v => v > 0));
  const range = max - min || 1;
  const w = 80, h = 30;
  const pts = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop()?.split(",")[0]} cy={pts.split(" ").pop()?.split(",")[1]} r="3" fill={cor} />
    </svg>
  );
}

export default function HistoricoTreinosPage(): React.JSX.Element {
  const supabase = createClient();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "Corrida",
    distancia_km: "",
    duracao_min: "",
    pace_medio: "",
    fc_media: "",
    fc_max: "",
    elevacao_m: "",
    calorias: "",
    notas: "",
  });

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserEmail(user.email);
    if (user.email) {
      const { data: adm } = await supabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single();
      setIsAdmin(!!adm);
    }
    const { data } = await supabase
      .from("historico_treinos")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .limit(60);
    setRegistros(data || []);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data || !form.tipo) { setErro("Data e tipo são obrigatórios."); return; }
    setSalvando(true); setErro(""); setSucesso("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      user_id: user.id,
      data: form.data,
      tipo: form.tipo,
      distancia_km: form.distancia_km ? parseFloat(form.distancia_km) : null,
      duracao_min: form.duracao_min ? parseInt(form.duracao_min) : null,
      pace_medio: form.pace_medio || null,
      fc_media: form.fc_media ? parseInt(form.fc_media) : null,
      fc_max: form.fc_max ? parseInt(form.fc_max) : null,
      elevacao_m: form.elevacao_m ? parseInt(form.elevacao_m) : null,
      calorias: form.calorias ? parseInt(form.calorias) : null,
      notas: form.notas || null,
    };
    const { error } = await supabase.from("historico_treinos").insert(payload);
    if (error) { setErro("Erro ao salvar: " + error.message); setSalvando(false); return; }
    setSucesso("Treino registrado! ✅");
    setForm({ data: new Date().toISOString().split("T")[0], tipo: "Corrida", distancia_km: "", duracao_min: "", pace_medio: "", fc_media: "", fc_max: "", elevacao_m: "", calorias: "", notas: "" });
    setShowForm(false);
    await carregar();
    setSalvando(false);
    setTimeout(() => setSucesso(""), 4000);
  }

  async function deletar(id: number) {
    if (!confirm("Remover este registro?")) return;
    setDeletando(id);
    await supabase.from("historico_treinos").delete().eq("id", id);
    await carregar();
    setDeletando(null);
  }

  // Stats
  const totalKm = registros.reduce((acc, r) => acc + (r.distancia_km || 0), 0);
  const totalMin = registros.reduce((acc, r) => acc + (r.duracao_min || 0), 0);
  const totalTreinos = registros.length;
  const ultimos30 = registros.filter(r => {
    const d = new Date(r.data);
    const agora = new Date();
    const diff = (agora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });
  const kmUltimos30 = ultimos30.reduce((acc, r) => acc + (r.distancia_km || 0), 0);

  // Para os gráficos: ordenados por data
  const ordenados = [...registros].sort((a, b) => a.data.localeCompare(b.data));

  function formatarData(d: string) {
    const [, m, dia] = d.split("-");
    return `${dia}/${m}`;
  }
  function formatarDuracao(min: number) {
    if (min >= 60) return `${Math.floor(min / 60)}h${min % 60 > 0 ? String(min % 60).padStart(2, "0") : ""}`;
    return `${min}min`;
  }

  if (loading) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full" style={{ border: "3px solid rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
          <p className="mt-3 text-sm" style={{ color: "#8B949E" }}>Carregando histórico...</p>
        </div>
      </main>
    </>
  );

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-12" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-20 top-0 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-4xl flex items-center justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
                style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                📈 EVOLUÇÃO
              </div>
              <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
                HISTÓRICO DE <span style={{ color: "#5CC800" }}>TREINOS</span>
              </h1>
              <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>Registre e acompanhe sua evolução ao longo do tempo.</p>
            </div>
            <button onClick={() => { setShowForm(!showForm); setErro(""); }}
              className="shrink-0 rounded-xl px-5 py-3 font-black text-sm transition-all hover:brightness-110 hover:scale-105"
              style={{ background: showForm ? "#21262D" : "linear-gradient(135deg, #5CC800, #4aaa00)", color: showForm ? "#8B949E" : "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              {showForm ? "✕ FECHAR" : "+ REGISTRAR"}
            </button>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

          {sucesso && (
            <div className="rounded-xl px-4 py-3 font-bold text-sm animate-slide-up" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.3)" }}>
              {sucesso}
            </div>
          )}

          {/* Formulário de registro */}
          {showForm && (
            <form onSubmit={salvar} className="rounded-2xl p-6 space-y-4 animate-slide-up" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <p className="font-black text-base" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>➕ NOVO REGISTRO</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label style={lbl}>📅 DATA</label>
                  <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={inp} required />
                </div>
                <div>
                  <label style={lbl}>🏃 TIPO</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inp}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>📏 DISTÂNCIA (km)</label>
                  <input type="number" step="0.01" placeholder="Ex: 10.5" value={form.distancia_km} onChange={e => setForm({ ...form, distancia_km: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>⏱ DURAÇÃO (minutos)</label>
                  <input type="number" placeholder="Ex: 55" value={form.duracao_min} onChange={e => setForm({ ...form, duracao_min: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>🎯 PACE MÉDIO (min/km)</label>
                  <input type="text" placeholder="Ex: 5:30" value={form.pace_medio} onChange={e => setForm({ ...form, pace_medio: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>❤️ FC MÉDIA (bpm)</label>
                  <input type="number" placeholder="Ex: 155" value={form.fc_media} onChange={e => setForm({ ...form, fc_media: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>🔺 ELEVAÇÃO (m)</label>
                  <input type="number" placeholder="Ex: 120" value={form.elevacao_m} onChange={e => setForm({ ...form, elevacao_m: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>🔥 CALORIAS (kcal)</label>
                  <input type="number" placeholder="Ex: 480" value={form.calorias} onChange={e => setForm({ ...form, calorias: e.target.value })} style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>📝 NOTAS</label>
                <textarea placeholder="Como foi o treino? Sensações, condição, etc." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  style={{ ...inp, resize: "vertical", minHeight: "70px" }} />
              </div>

              {erro && <p className="rounded-xl px-4 py-3 text-sm font-bold" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)" }}>{erro}</p>}

              <div className="flex gap-3">
                <button type="submit" disabled={salvando}
                  className="flex-1 rounded-xl py-3.5 font-black text-sm transition-all hover:brightness-110"
                  style={{ background: salvando ? "#21262D" : "linear-gradient(135deg, #5CC800, #4aaa00)", color: salvando ? "#8B949E" : "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  {salvando ? "SALVANDO..." : "✅ SALVAR TREINO"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setErro(""); }}
                  className="rounded-xl px-5 py-3.5 font-black text-sm"
                  style={{ background: "#21262D", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  CANCELAR
                </button>
              </div>
            </form>
          )}

          {/* Stats resumo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "TREINOS TOTAIS", value: String(totalTreinos), color: "#5CC800", icon: "🏃" },
              { label: "KM TOTAIS", value: `${totalKm.toFixed(1)}km`, color: "#FF6B00", icon: "📏" },
              { label: "TEMPO TOTAL", value: formatarDuracao(totalMin), color: "#FFB800", icon: "⏱" },
              { label: "KM (30 DIAS)", value: `${kmUltimos30.toFixed(1)}km`, color: "#5CC800", icon: "📅" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-xl font-black leading-none" style={{ color: s.color, fontFamily: "'Barlow Condensed', sans-serif" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Gráficos de barra */}
          {ordenados.length >= 2 && (
            <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
              <p className="font-black text-sm mb-4" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>📊 HISTÓRICO (ÚLTIMAS ATIVIDADES)</p>
              <div className="grid gap-5 sm:grid-cols-3">
                <MiniBarChart dados={ordenados} campo="distancia_km" cor="#5CC800" label="DISTÂNCIA (km)" />
                <MiniBarChart dados={ordenados} campo="duracao_min" cor="#FF6B00" label="DURAÇÃO (min)" />
                <MiniBarChart dados={ordenados} campo="fc_media" cor="#EF4444" label="FC MÉDIA (bpm)" />
              </div>
              {/* Legenda datas */}
              <div className="mt-2 flex gap-1">
                {ordenados.slice(-12).map((r, i) => (
                  <div key={r.id} className="flex-1 text-center">
                    {(i === 0 || i === Math.floor(ordenados.slice(-12).length / 2) || i === ordenados.slice(-12).length - 1) && (
                      <p className="text-xs" style={{ color: "#8B949E", fontSize: "9px" }}>{formatarData(r.data)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de registros */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
              <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                ATIVIDADES
              </h2>
              <span className="text-sm" style={{ color: "#8B949E" }}>{registros.length} registros</span>
            </div>

            {registros.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.2)" }}>
                <p className="text-3xl mb-2">📊</p>
                <p className="font-black text-base" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUM TREINO REGISTRADO</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "#8B949E" }}>Registre seu primeiro treino para começar a acompanhar sua evolução!</p>
                <button onClick={() => setShowForm(true)}
                  className="rounded-xl px-5 py-3 font-black text-sm"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  + REGISTRAR TREINO
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {registros.map(r => (
                  <div key={r.id} className="relative overflow-hidden rounded-2xl p-4 transition-all"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.08)" }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "#5CC800" }} />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-black text-base" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{r.tipo}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "#21262D", color: "#8B949E" }}>{formatarData(r.data)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {r.distancia_km && <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>📏 {r.distancia_km}km</span>}
                          {r.duracao_min && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "#21262D", color: "#8B949E" }}>⏱ {formatarDuracao(r.duracao_min)}</span>}
                          {r.pace_medio && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "#21262D", color: "#8B949E" }}>🎯 {r.pace_medio}/km</span>}
                          {r.fc_media && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>❤️ {r.fc_media}bpm</span>}
                          {r.elevacao_m ? <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "#21262D", color: "#8B949E" }}>🔺 {r.elevacao_m}m</span> : null}
                          {r.calorias ? <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "#21262D", color: "#8B949E" }}>🔥 {r.calorias}kcal</span> : null}
                        </div>
                        {r.notas && <p className="mt-1.5 text-xs" style={{ color: "#8B949E" }}>📝 {r.notas}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <SparkLine dados={ordenados.slice(0, ordenados.findIndex(x => x.id === r.id) + 1)} campo="distancia_km" cor="#5CC800" />
                        <button onClick={() => deletar(r.id)} disabled={deletando === r.id}
                          className="rounded-lg px-2.5 py-2 text-xs transition-all hover:brightness-110"
                          style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>
                          {deletando === r.id ? "..." : "🗑"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links ferramentas */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/calculadora-pace" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <p className="text-xl mb-1">⏱</p>
              <p className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>CALCULADORA PACE</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Ritmo por km</p>
            </Link>
            <Link href="/planos-treino" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.2)" }}>
              <p className="text-xl mb-1">📋</p>
              <p className="font-black text-sm" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>PLANOS DE TREINO</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Do zero ao 5km</p>
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
