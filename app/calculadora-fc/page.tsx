"use client";

import React, { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import { Heart, Timer, ClipboardList, Activity, Info } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const inp = {
  background: "#21262D",
  border: "1px solid rgba(255,107,0,0.25)",
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

const FORMULAS = [
  { id: "tanaka", label: "Tanaka (recomendado)", calc: (idade: number) => 208 - 0.7 * idade },
  { id: "karvonen", label: "220 - Idade (clássica)", calc: (idade: number) => 220 - idade },
  { id: "gelish", label: "Gelish (atletas)", calc: (idade: number) => 207 - 0.7 * idade },
];

const ZONAS = [
  { zona: "Z1", nome: "Regenerativo", pctMin: 0.50, pctMax: 0.60, cor: "#3B82F6", desc: "Recuperação ativa. Conversa normal, muito confortável.", treino: "Caminhada, corrida muito leve após provas" },
  { zona: "Z2", nome: "Base Aeróbica", pctMin: 0.60, pctMax: 0.70, cor: "#22C55E", desc: "Constrói base e queima gordura. Consegue conversar.", treino: "Longões, corridas de base (60-80% do volume)" },
  { zona: "Z3", nome: "Aeróbico", pctMin: 0.70, pctMax: 0.80, cor: "#A3E635", desc: "Moderado. Resposta em frases curtas. Melhora resistência.", treino: "Corridas moderadas, progressivos" },
  { zona: "Z4", nome: "Limiar Anaeróbico", pctMin: 0.80, pctMax: 0.90, cor: "#F97316", desc: "Intenso. Difícil conversar. Melhora ritmo de prova.", treino: "Tiros longos, intervalados, ritmo de prova 10km" },
  { zona: "Z5", nome: "VO₂ Max / Sprint", pctMin: 0.90, pctMax: 1.00, cor: "#EF4444", desc: "Máximo esforço. Insustentável por mais de alguns minutos.", treino: "Sprints, tiros curtos, subidas" },
];

function BarraZona({ pct, cor }: { pct: number; cor: string }) {
  const width = (pct * 100).toFixed(0) + "%";
  return (
    <div
      className="h-full rounded-full"
      style={{ width, background: `linear-gradient(90deg, ${cor}40, ${cor})` }}
    />
  );
}

export default function CalculadoraFCPage(): React.JSX.Element {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  const [idade, setIdade] = useState("");
  const [fcRepouso, setFcRepouso] = useState("");
  const [formula, setFormula] = useState("tanaka");
  const [resultado, setResultado] = useState<null | {
    fcMax: number;
    fcReserva: number | null;
    zonas: { zona: string; nome: string; cor: string; desc: string; treino: string; pctMin: number; pctMax: number; fcMin: number; fcMax: number; fcKarvMin: number; fcKarvMax: number }[];
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
    const id = parseInt(idade);
    if (!id || id < 10 || id > 100) { setErro("Informe uma idade válida (10-100 anos)."); return; }

    const form = FORMULAS.find(f => f.id === formula)!;
    const fcMax = Math.round(form.calc(id));
    const fcRep = fcRepouso ? parseInt(fcRepouso) : null;
    const fcReserva = fcRep ? fcMax - fcRep : null;

    const zonas = ZONAS.map(z => {
      const fcMin = Math.round(fcMax * z.pctMin);
      const fcMaxZ = Math.round(fcMax * z.pctMax);
      // Karvonen (usa FC de reserva)
      const fcKarvMin = fcReserva && fcRep ? Math.round(fcRep + fcReserva * z.pctMin) : fcMin;
      const fcKarvMax = fcReserva && fcRep ? Math.round(fcRep + fcReserva * z.pctMax) : fcMaxZ;
      return { ...z, fcMin, fcMax: fcMaxZ, fcKarvMin, fcKarvMax };
    });

    setResultado({ fcMax, fcReserva, zonas });
  }, [idade, fcRepouso, formula]);

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-12" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FF6B00, transparent)" }} />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
              style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
              ❤️ FREQUÊNCIA CARDÍACA
            </div>
            <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
              ZONAS DE <span style={{ color: "#FF6B00" }}>FREQUÊNCIA</span><br />
              <span style={{ color: "#E6EDF3" }}>CARDÍACA</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>
              Descubra suas zonas Z1-Z5 e treine no ritmo certo para cada objetivo.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">

          {/* Formulário */}
          <div className="rounded-2xl p-6 space-y-5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.12)" }}>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label style={lbl}>🎂 IDADE</label>
                <input type="number" min="10" max="100" placeholder="Ex: 32" value={idade} onChange={e => setIdade(e.target.value)}
                  style={{ ...inp, border: "1px solid rgba(255,107,0,0.25)" }} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[20, 25, 30, 35, 40, 45, 50].map(v => (
                    <button key={v} onClick={() => setIdade(String(v))}
                      className="rounded-lg px-2.5 py-1 text-xs font-black"
                      style={{ background: idade === String(v) ? "rgba(255,107,0,0.2)" : "#21262D", color: idade === String(v) ? "#FF6B00" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", border: `1px solid ${idade === String(v) ? "rgba(255,107,0,0.4)" : "transparent"}` }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>💤 FC DE REPOUSO (bpm) — opcional</label>
                <input type="number" min="30" max="100" placeholder="Ex: 55 (para Karvonen)" value={fcRepouso} onChange={e => setFcRepouso(e.target.value)}
                  style={{ ...inp, border: "1px solid rgba(255,107,0,0.25)" }} />
                <p className="mt-1.5 text-xs" style={{ color: "#8B949E" }}>Meça pela manhã ao acordar. Ativa o método Karvonen (mais preciso).</p>
              </div>
            </div>

            <div>
              <label style={lbl}>🧮 FÓRMULA</label>
              <div className="grid gap-2">
                {FORMULAS.map(f => (
                  <button key={f.id} onClick={() => setFormula(f.id)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                    style={{ background: formula === f.id ? "rgba(255,107,0,0.1)" : "#21262D", border: `1px solid ${formula === f.id ? "rgba(255,107,0,0.4)" : "transparent"}` }}>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ border: `2px solid ${formula === f.id ? "#FF6B00" : "#8B949E"}` }}>
                      {formula === f.id && <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF6B00" }} />}
                    </div>
                    <span className="text-sm font-bold" style={{ color: formula === f.id ? "#E6EDF3" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {erro && <p className="rounded-xl px-4 py-3 text-sm font-bold" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)" }}>{erro}</p>}

            <button onClick={calcular} className="w-full rounded-xl py-4 font-black text-base transition-all hover:brightness-110 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #FF6B00, #cc5500)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", boxShadow: "0 4px 20px rgba(255,107,0,0.2)" }}>
              ❤️ CALCULAR ZONAS
            </button>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="space-y-4 animate-slide-up">
              {/* FC Max destaque */}
              <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, #2d1000, #1a0a00)", border: "1px solid rgba(255,107,0,0.3)" }}>
                <p className="text-xs font-black" style={{ color: "rgba(255,107,0,0.6)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>SUA FREQUÊNCIA CARDÍACA MÁXIMA</p>
                <p className="text-7xl font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{resultado.fcMax}</p>
                <p className="text-base font-bold" style={{ color: "#8B949E" }}>bpm</p>
                {resultado.fcReserva && (
                  <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>
                    FC de Reserva: <span style={{ color: "#FFB800", fontWeight: 700 }}>{resultado.fcReserva} bpm</span>
                  </p>
                )}
              </div>

              {/* Zonas */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,107,0,0.15)" }}>
                <div className="px-5 py-3" style={{ background: "#161B22", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-xs font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                    📊 SUAS ZONAS {resultado.fcReserva ? "(MÉTODO KARVONEN)" : "(% FC MÁXIMA)"}
                  </p>
                </div>
                <div>
                  {resultado.zonas.map((z, i) => (
                    <div key={z.zona} className="p-4" style={{ background: i % 2 === 0 ? "#161B22" : "#1a1f26", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div className="flex items-start gap-3">
                        {/* Zona badge */}
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl font-black"
                          style={{ background: z.cor + "20", border: `1px solid ${z.cor}40` }}>
                          <span className="text-xs" style={{ color: z.cor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>{z.zona}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-black text-base" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{z.nome}</p>
                            <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: z.cor + "20", color: z.cor, fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {resultado.fcReserva ? `${z.fcKarvMin}–${z.fcKarvMax} bpm` : `${z.fcMin}–${z.fcMax} bpm`}
                            </span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: "#8B949E" }}>{z.desc}</p>
                          <p className="text-xs" style={{ color: z.cor + "cc" }}>💡 {z.treino}</p>
                          {/* Barra visual */}
                          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#21262D" }}>
                            <BarraZona pct={z.pctMax} cor={z.cor} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dica */}
              <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.15)" }}>
                <p className="text-xs font-black mb-2" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>💡 COMO USAR</p>
                <p className="text-xs" style={{ color: "#8B949E" }}>
                  Para iniciantes: 80% do volume em Z1-Z2. Para intermediários: 70% em Z2, 20% em Z4, 10% em Z5. Monitore com um relógio de FC para treinos mais precisos.
                </p>
              </div>
            </div>
          )}

          {/* Link para calculadora de pace */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/calculadora-pace" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <Timer size={22} color="#5CC800" strokeWidth={1.75} style={{ marginBottom: "4px" }} />
              <p className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>CALCULADORA PACE</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Ritmo, tempo e distância</p>
            </Link>
            <Link href="/planos-treino" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.2)" }}>
              <ClipboardList size={22} color="#FF6B00" strokeWidth={1.75} style={{ marginBottom: "4px" }} />
              <p className="font-black text-sm" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>PLANOS DE TREINO</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Do zero ao 5km</p>
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
