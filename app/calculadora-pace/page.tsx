"use client";

import React, { useState, useCallback } from "react";
import Header from "@/components/Header";
import { Timer, Ruler, Flag, Zap, Heart, ClipboardList, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";
import Link from "next/link";

const inp = {
  background: "#21262D",
  border: "1px solid rgba(92,200,0,0.25)",
  color: "#E6EDF3",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "16px",
  outline: "none",
  width: "100%",
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  letterSpacing: "0.05em",
} as React.CSSProperties;

const lbl = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#8B949E",
  marginBottom: "6px",
  fontFamily: "'Barlow Condensed', sans-serif",
  letterSpacing: "0.1em",
} as React.CSSProperties;

function parseMinSec(val: string): number | null {
  const parts = val.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0]);
    const s = parseInt(parts[1]);
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
  }
  const n = parseFloat(val.replace(",", "."));
  if (!isNaN(n)) return n * 60;
  return null;
}

function formatarPace(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatarTempo(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = Math.round(seg % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min ${String(s).padStart(2, "0")}s`;
  return `${m}min ${String(s).padStart(2, "0")}s`;
}

const PROVAS = [
  { label: "1 km", dist: 1 },
  { label: "5 km", dist: 5 },
  { label: "10 km", dist: 10 },
  { label: "Meia Maratona", dist: 21.097 },
  { label: "Maratona", dist: 42.195 },
];

const ZONAS_PACE = [
  { zona: "Z1", nome: "Regenerativo", cor: "#3B82F6", pct: "75-80%", desc: "Conversa fácil, recuperação ativa" },
  { zona: "Z2", nome: "Base aeróbica", cor: "#22C55E", pct: "80-85%", desc: "Longões e base de condicionamento" },
  { zona: "Z3", nome: "Limiar aeróbico", cor: "#EAB308", pct: "85-90%", desc: "Corrida de prova 10km/meia" },
  { zona: "Z4", nome: "Limiar anaeróbico", cor: "#F97316", pct: "90-95%", desc: "Tiros e treinos de qualidade" },
  { zona: "Z5", nome: "VO2 Max", cor: "#EF4444", pct: "95-100%", desc: "Sprints e repetições curtas" },
];

export default function CalculadoraPacePage(): React.JSX.Element {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  // Modo ativo
  const [modo, setModo] = useState<"pace" | "tempo" | "distancia">("pace");

  // Inputs
  const [distancia, setDistancia] = useState("");
  const [tempo, setTempo] = useState({ h: "", m: "", s: "" });
  const [pace, setPace] = useState({ m: "", s: "" });

  // Resultado
  const [resultado, setResultado] = useState<null | {
    pace: string; tempo: string; distancia: string;
    velocidade: string; provas: { label: string; tempo: string }[];
  }>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email);
      if (user?.email) {
        supabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single()
          .then(({ data }) => setIsAdmin(!!data));
      }
    });
  }, []); // eslint-disable-line

  const calcular = useCallback(() => {
    setErro("");
    setResultado(null);

    if (modo === "pace") {
      // Calcula pace a partir de distância + tempo
      const dist = parseFloat(distancia.replace(",", "."));
      const totalSeg = (parseInt(tempo.h || "0") * 3600) + (parseInt(tempo.m || "0") * 60) + parseInt(tempo.s || "0");
      if (!dist || dist <= 0 || totalSeg <= 0) { setErro("Preencha distância e tempo corretamente."); return; }
      const paceSeg = totalSeg / dist;
      const velKmh = (dist / totalSeg) * 3600;
      setResultado({
        pace: formatarPace(paceSeg),
        tempo: formatarTempo(totalSeg),
        distancia: `${dist} km`,
        velocidade: velKmh.toFixed(1),
        provas: PROVAS.map(p => ({ label: p.label, tempo: formatarTempo(paceSeg * p.dist) })),
      });
    } else if (modo === "tempo") {
      // Calcula tempo a partir de distância + pace
      const dist = parseFloat(distancia.replace(",", "."));
      const paceSeg = (parseInt(pace.m || "0") * 60) + parseInt(pace.s || "0");
      if (!dist || dist <= 0 || paceSeg <= 0) { setErro("Preencha distância e pace corretamente."); return; }
      const totalSeg = paceSeg * dist;
      const velKmh = 3600 / paceSeg;
      setResultado({
        pace: formatarPace(paceSeg),
        tempo: formatarTempo(totalSeg),
        distancia: `${dist} km`,
        velocidade: velKmh.toFixed(1),
        provas: PROVAS.map(p => ({ label: p.label, tempo: formatarTempo(paceSeg * p.dist) })),
      });
    } else {
      // Calcula distância a partir de tempo + pace
      const totalSeg = (parseInt(tempo.h || "0") * 3600) + (parseInt(tempo.m || "0") * 60) + parseInt(tempo.s || "0");
      const paceSeg = (parseInt(pace.m || "0") * 60) + parseInt(pace.s || "0");
      if (totalSeg <= 0 || paceSeg <= 0) { setErro("Preencha tempo e pace corretamente."); return; }
      const dist = totalSeg / paceSeg;
      const velKmh = 3600 / paceSeg;
      setResultado({
        pace: formatarPace(paceSeg),
        tempo: formatarTempo(totalSeg),
        distancia: `${dist.toFixed(2)} km`,
        velocidade: velKmh.toFixed(1),
        provas: PROVAS.map(p => ({ label: p.label, tempo: formatarTempo(paceSeg * p.dist) })),
      });
    }
  }, [modo, distancia, tempo, pace]);

  const modos = [
    { id: "pace",      label: "CALCULAR PACE",      IconEl: Timer  },
    { id: "tempo",     label: "CALCULAR TEMPO",      IconEl: Flag   },
    { id: "distancia", label: "CALCULAR DISTÂNCIA",  IconEl: Ruler  },
  ] as const;

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-12" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
              style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
              ⏱ FERRAMENTAS
            </div>
            <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
              CALCULADORA DE <span style={{ color: "#5CC800" }}>PACE</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>
              Calcule ritmo, tempo ou distância para planejar seus treinos e provas.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">

          {/* Seletor de modo */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl p-1.5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
            {modos.map(m => (
              <button key={m.id} onClick={() => { setModo(m.id); setResultado(null); setErro(""); }}
                className="rounded-xl py-3 text-xs font-black transition-all"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em",
                  background: modo === m.id ? "linear-gradient(135deg, #5CC800, #4aaa00)" : "transparent",
                  color: modo === m.id ? "#fff" : "#8B949E",
                }}>
                <m.IconEl size={18} strokeWidth={modo === m.id ? 2.5 : 1.75} style={{ margin: "0 auto" }} />
                <span className="hidden sm:block mt-0.5">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Formulário */}
          <div className="rounded-2xl p-6 space-y-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.12)" }}>

            {/* Distância */}
            {(modo === "pace" || modo === "tempo") && (
              <div>
                <label style={lbl}>📏 DISTÂNCIA (km)</label>
                <input type="number" step="0.01" placeholder="Ex: 10" value={distancia} onChange={e => setDistancia(e.target.value)} style={inp} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[1, 5, 10, 21.097, 42.195].map(d => (
                    <button key={d} onClick={() => setDistancia(String(d))}
                      className="rounded-lg px-2.5 py-1 text-xs font-black transition-all hover:brightness-110"
                      style={{ background: distancia === String(d) ? "rgba(92,200,0,0.2)" : "#21262D", color: distancia === String(d) ? "#5CC800" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", border: `1px solid ${distancia === String(d) ? "rgba(92,200,0,0.4)" : "transparent"}` }}>
                      {d === 21.097 ? "21km" : d === 42.195 ? "42km" : `${d}km`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tempo */}
            {(modo === "pace" || modo === "distancia") && (
              <div>
                <label style={lbl}>⏱ TEMPO</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["h", "m", "s"] as const).map((unit, i) => (
                    <div key={unit}>
                      <input type="number" min="0" max={unit === "h" ? 23 : 59} placeholder={["Horas", "Minutos", "Segundos"][i]}
                        value={tempo[unit]} onChange={e => setTempo({ ...tempo, [unit]: e.target.value })}
                        style={{ ...inp, textAlign: "center" }} />
                      <p className="text-center text-xs mt-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{["HH", "MM", "SS"][i]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pace */}
            {(modo === "tempo" || modo === "distancia") && (
              <div>
                <label style={lbl}>🎯 PACE (min/km)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="number" min="0" max="59" placeholder="Minutos" value={pace.m} onChange={e => setPace({ ...pace, m: e.target.value })} style={{ ...inp, textAlign: "center" }} />
                    <p className="text-center text-xs mt-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>MIN</p>
                  </div>
                  <div>
                    <input type="number" min="0" max="59" placeholder="Segundos" value={pace.s} onChange={e => setPace({ ...pace, s: e.target.value })} style={{ ...inp, textAlign: "center" }} />
                    <p className="text-center text-xs mt-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>SEG</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[["4:00", 4, 0], ["4:30", 4, 30], ["5:00", 5, 0], ["5:30", 5, 30], ["6:00", 6, 0], ["6:30", 6, 30]].map(([label, m, s]) => (
                    <button key={String(label)} onClick={() => setPace({ m: String(m), s: String(s) })}
                      className="rounded-lg px-2.5 py-1 text-xs font-black transition-all"
                      style={{ background: pace.m === String(m) && pace.s === String(s) ? "rgba(92,200,0,0.2)" : "#21262D", color: pace.m === String(m) && pace.s === String(s) ? "#5CC800" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", border: `1px solid ${pace.m === String(m) && pace.s === String(s) ? "rgba(92,200,0,0.4)" : "transparent"}` }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {erro && <p className="rounded-xl px-4 py-3 text-sm font-bold" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)" }}>{erro}</p>}

            <button onClick={calcular} className="w-full rounded-xl py-4 font-black text-base transition-all hover:brightness-110 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", boxShadow: "0 4px 20px rgba(92,200,0,0.2)" }}>
              ⚡ CALCULAR
            </button>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="rounded-2xl overflow-hidden animate-slide-up" style={{ border: "1px solid rgba(92,200,0,0.3)" }}>
              <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1a3a0a, #0f2106)" }}>
                <p className="text-xs font-black mb-3" style={{ color: "rgba(92,200,0,0.6)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>✅ RESULTADO</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "PACE", value: resultado.pace, unit: "min/km", color: "#5CC800" },
                    { label: "TEMPO", value: resultado.tempo, unit: "", color: "#FF6B00" },
                    { label: "DISTÂNCIA", value: resultado.distancia, unit: "", color: "#FFB800" },
                    { label: "VELOCIDADE", value: resultado.velocidade, unit: "km/h", color: "#5CC800" },
                  ].map(item => (
                    <div key={item.label} className="text-center rounded-xl p-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                      <p className="text-xs font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{item.label}</p>
                      <p className="text-2xl font-black mt-1" style={{ color: item.color, fontFamily: "'Barlow Condensed', sans-serif" }}>{item.value}</p>
                      {item.unit && <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{item.unit}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Provas */}
              <div className="p-5" style={{ background: "#161B22" }}>
                <p className="text-xs font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>🏁 PREVISÃO PARA PROVAS (COM ESTE PACE)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {resultado.provas.map(p => (
                    <div key={p.label} className="rounded-xl p-3 text-center" style={{ background: "#21262D" }}>
                      <p className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{p.label}</p>
                      <p className="text-sm font-black mt-1" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{p.tempo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Zonas de pace */}
          <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.15)" }}>
            <p className="text-sm font-black mb-4" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>📊 ZONAS DE TREINAMENTO</p>
            <div className="space-y-2">
              {ZONAS_PACE.map(z => (
                <div key={z.zona} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#21262D" }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-xs" style={{ background: z.cor + "20", color: z.cor, fontFamily: "'Barlow Condensed', sans-serif" }}>{z.zona}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{z.nome}</p>
                      <span className="text-xs font-bold" style={{ color: z.cor }}>{z.pct} FC máx</span>
                    </div>
                    <p className="text-xs" style={{ color: "#8B949E" }}>{z.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Links para outras ferramentas */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/calculadora-fc" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.2)" }}>
              <Heart size={22} color="#FF6B00" strokeWidth={1.75} style={{ marginBottom: "4px" }} />
              <p className="font-black text-sm" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>CALCULADORA FC</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Zonas Z1-Z5</p>
            </Link>
            <Link href="/planos-treino" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <ClipboardList size={22} color="#5CC800" strokeWidth={1.75} style={{ marginBottom: "4px" }} />
              <p className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>PLANOS DE TREINO</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Do zero ao 5km</p>
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
