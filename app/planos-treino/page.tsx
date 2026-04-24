"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const PLANOS = [
  {
    id: "zero-5k",
    titulo: "Do Zero ao 5km",
    subtitulo: "Iniciante",
    semanas: 8,
    icon: "🚶",
    cor: "#5CC800",
    corBg: "rgba(92,200,0,0.1)",
    corBorder: "rgba(92,200,0,0.2)",
    desc: "Ideal para quem nunca correu ou ficou muito tempo parado. Começa com corrida/caminhada alternada.",
    objetivo: "Correr 5km sem parar",
    nivel: "Iniciante",
    diasSemana: 3,
    semanas_plano: [
      { sem: 1, treinos: [
        { dia: "Seg", tipo: "Corrida/Caminhada", desc: "3x (1min corrida + 2min caminhada) = 9min", km: "2km aprox", intensidade: "Z2" },
        { dia: "Qua", tipo: "Corrida/Caminhada", desc: "3x (1min corrida + 2min caminhada) = 9min", km: "2km aprox", intensidade: "Z2" },
        { dia: "Sex", tipo: "Corrida/Caminhada", desc: "4x (1min corrida + 2min caminhada) = 12min", km: "2.5km aprox", intensidade: "Z2" },
      ]},
      { sem: 2, treinos: [
        { dia: "Seg", tipo: "Corrida/Caminhada", desc: "4x (2min corrida + 2min caminhada) = 16min", km: "2.5km", intensidade: "Z2" },
        { dia: "Qua", tipo: "Corrida/Caminhada", desc: "4x (2min corrida + 2min caminhada) = 16min", km: "2.5km", intensidade: "Z2" },
        { dia: "Sex", tipo: "Corrida/Caminhada", desc: "5x (2min corrida + 1min caminhada) = 15min", km: "3km", intensidade: "Z2" },
      ]},
      { sem: 3, treinos: [
        { dia: "Seg", tipo: "Corrida contínua", desc: "15min corrida leve contínua", km: "2.5km", intensidade: "Z2" },
        { dia: "Qua", tipo: "Corrida", desc: "3x (5min corrida + 1min caminhada)", km: "3km", intensidade: "Z2" },
        { dia: "Sex", tipo: "Corrida", desc: "20min corrida leve", km: "3km", intensidade: "Z2" },
      ]},
      { sem: 4, treinos: [
        { dia: "Seg", tipo: "Corrida", desc: "20min corrida moderada", km: "3.5km", intensidade: "Z2-Z3" },
        { dia: "Qua", tipo: "Fartlek", desc: "20min c/ 3x(1min acelerado + 2min leve)", km: "3.5km", intensidade: "Z2-Z4" },
        { dia: "Sex", tipo: "Corrida longa", desc: "25min corrida leve — SEMANA DE ADAPTAÇÃO", km: "4km", intensidade: "Z2" },
      ]},
      { sem: 5, treinos: [
        { dia: "Seg", tipo: "Corrida", desc: "25min corrida moderada", km: "4km", intensidade: "Z3" },
        { dia: "Qua", tipo: "Intervalado", desc: "5x (3min forte + 2min leve)", km: "4km", intensidade: "Z3-Z4" },
        { dia: "Sex", tipo: "Corrida longa", desc: "30min corrida leve", km: "4.5km", intensidade: "Z2" },
      ]},
      { sem: 6, treinos: [
        { dia: "Seg", tipo: "Corrida", desc: "28min corrida moderada", km: "4.5km", intensidade: "Z3" },
        { dia: "Qua", tipo: "Intervalado", desc: "6x (3min forte + 2min leve)", km: "4.5km", intensidade: "Z3-Z4" },
        { dia: "Sex", tipo: "Corrida longa", desc: "35min corrida leve", km: "5km", intensidade: "Z2" },
      ]},
      { sem: 7, treinos: [
        { dia: "Seg", tipo: "Corrida", desc: "30min corrida moderada", km: "5km", intensidade: "Z3" },
        { dia: "Qua", tipo: "Tiro", desc: "4x (5min no ritmo de prova + 2min leve)", km: "5km", intensidade: "Z4" },
        { dia: "Sex", tipo: "Corrida leve", desc: "20min regenerativo — semana de pico", km: "3km", intensidade: "Z1-Z2" },
      ]},
      { sem: 8, treinos: [
        { dia: "Seg", tipo: "Corrida leve", desc: "20min bem leve", km: "3km", intensidade: "Z1-Z2" },
        { dia: "Qua", tipo: "Strides", desc: "15min leve + 4x strides de 20seg", km: "2.5km", intensidade: "Z2" },
        { dia: "Sex/Sáb", tipo: "🏁 PROVA / TESTE", desc: "CORRER 5KM! Você está pronto!", km: "5km", intensidade: "Z4-Z5" },
      ]},
    ],
  },
  {
    id: "5k-10k",
    titulo: "De 5km para 10km",
    subtitulo: "Intermediário",
    semanas: 8,
    icon: "🏃",
    cor: "#FF6B00",
    corBg: "rgba(255,107,0,0.1)",
    corBorder: "rgba(255,107,0,0.2)",
    desc: "Para quem já corre os 5km e quer dobrar a distância. Foco em volume e resistência aeróbica.",
    objetivo: "Correr 10km em menos de 1h",
    nivel: "Intermediário",
    diasSemana: 4,
    semanas_plano: [
      { sem: 1, treinos: [
        { dia: "Ter", tipo: "Corrida base", desc: "30min corrida leve Z2", km: "5km", intensidade: "Z2" },
        { dia: "Qui", tipo: "Intervalado", desc: "6x (3min em Z4 + 2min leve)", km: "5km", intensidade: "Z2-Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "45min corrida leve Z2", km: "7km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "20min caminhada ou corrida muito leve", km: "—", intensidade: "Z1" },
      ]},
      { sem: 2, treinos: [
        { dia: "Ter", tipo: "Corrida base", desc: "35min corrida moderada", km: "6km", intensidade: "Z2-Z3" },
        { dia: "Qui", tipo: "Fartlek", desc: "35min c/ 5x(2min acelerado + 1min fácil)", km: "6km", intensidade: "Z2-Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "50min corrida leve", km: "8km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "20min muito leve", km: "3km", intensidade: "Z1" },
      ]},
      { sem: 3, treinos: [
        { dia: "Ter", tipo: "Progressivo", desc: "30min: 10 leve → 10 moderado → 10 forte", km: "5.5km", intensidade: "Z2-Z4" },
        { dia: "Qui", tipo: "Intervalado", desc: "8x (2min em Z4 + 90seg fácil)", km: "6km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "55min corrida leve", km: "9km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Recuperação", desc: "Descanso ativo ou alongamento 20min", km: "—", intensidade: "Z1" },
      ]},
      { sem: 4, treinos: [
        { dia: "Ter", tipo: "Corrida base", desc: "30min leve — SEMANA LEVE", km: "5km", intensidade: "Z2" },
        { dia: "Qui", tipo: "Strides", desc: "20min leve + 6x strides 20seg", km: "4km", intensidade: "Z2-Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "45min leve", km: "7km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Descanso", desc: "Descanso completo", km: "—", intensidade: "—" },
      ]},
      { sem: 5, treinos: [
        { dia: "Ter", tipo: "Tempo run", desc: "10min leve + 20min em Z3 + 5min leve", km: "6km", intensidade: "Z3" },
        { dia: "Qui", tipo: "Intervalado", desc: "5x (1km no ritmo de prova + 2min leve)", km: "7km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "60min corrida leve", km: "9.5km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "20min leve", km: "3km", intensidade: "Z1" },
      ]},
      { sem: 6, treinos: [
        { dia: "Ter", tipo: "Tempo run", desc: "10min leve + 25min em Z3 + 5min leve", km: "6.5km", intensidade: "Z3" },
        { dia: "Qui", tipo: "Tiros 1km", desc: "6x (1km no ritmo de prova + 90seg leve)", km: "8km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "65min corrida leve", km: "10km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "25min leve", km: "3.5km", intensidade: "Z1" },
      ]},
      { sem: 7, treinos: [
        { dia: "Ter", tipo: "Progressivo", desc: "40min progressivo até Z4 no final", km: "7km", intensidade: "Z2-Z4" },
        { dia: "Qui", tipo: "Simulado 10km", desc: "Correr 8km no ritmo de prova", km: "8km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Corrida leve", desc: "30min recuperação — semana de pico", km: "5km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Descanso", desc: "Descanse", km: "—", intensidade: "—" },
      ]},
      { sem: 8, treinos: [
        { dia: "Ter", tipo: "Corrida leve", desc: "25min bem leve", km: "4km", intensidade: "Z1-Z2" },
        { dia: "Qui", tipo: "Ativação", desc: "15min leve + 4x strides", km: "3km", intensidade: "Z2" },
        { dia: "Sáb", tipo: "🏁 DIA DA PROVA", desc: "CORRER 10KM! Boa prova!", km: "10km", intensidade: "Z4" },
        { dia: "Dom", tipo: "Recuperação", desc: "Descanso total e comemoração!", km: "—", intensidade: "Z1" },
      ]},
    ],
  },
  {
    id: "10k-meia",
    titulo: "10km → Meia Maratona",
    subtitulo: "Avançado",
    semanas: 12,
    icon: "🏅",
    cor: "#FFB800",
    corBg: "rgba(255,184,0,0.1)",
    corBorder: "rgba(255,184,0,0.2)",
    desc: "Para corredores de 10km que querem encarar a meia maratona. 12 semanas com volume progressivo.",
    objetivo: "Completar a meia maratona (21km)",
    nivel: "Avançado",
    diasSemana: 4,
    semanas_plano: [
      { sem: 1, treinos: [
        { dia: "Ter", tipo: "Corrida base", desc: "40min em Z2", km: "7km", intensidade: "Z2" },
        { dia: "Qui", tipo: "Intervalado", desc: "8x (3min em Z4 + 2min fácil)", km: "7km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "60min Z2", km: "10km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "30min Z1", km: "4km", intensidade: "Z1" },
      ]},
      { sem: 2, treinos: [
        { dia: "Ter", tipo: "Tempo run", desc: "15min leve + 25min Z3 + 10min leve", km: "8km", intensidade: "Z3" },
        { dia: "Qui", tipo: "Intervalado", desc: "6x (1km em Z4 + 2min fácil)", km: "9km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "70min Z2", km: "11.5km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "30min Z1", km: "4km", intensidade: "Z1" },
      ]},
      { sem: 3, treinos: [
        { dia: "Ter", tipo: "Progressivo", desc: "50min progressivo até Z4 final", km: "9km", intensidade: "Z2-Z4" },
        { dia: "Qui", tipo: "Tiros", desc: "10x (2min em Z4 + 1min fácil)", km: "8km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "80min Z2", km: "13km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "35min Z1", km: "5km", intensidade: "Z1" },
      ]},
      { sem: 4, treinos: [
        { dia: "Ter", tipo: "Corrida leve", desc: "35min leve — SEMANA DE RECUPERAÇÃO", km: "6km", intensidade: "Z2" },
        { dia: "Qui", tipo: "Strides", desc: "25min leve + 6x strides", km: "5km", intensidade: "Z2" },
        { dia: "Sáb", tipo: "Longão leve", desc: "60min Z2", km: "10km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Descanso", desc: "Descanse", km: "—", intensidade: "—" },
      ]},
      { sem: 5, treinos: [
        { dia: "Ter", tipo: "Tempo run", desc: "15min leve + 30min Z3 + 10min leve", km: "9km", intensidade: "Z3" },
        { dia: "Qui", tipo: "Intervalado", desc: "5x (2km em Z4 + 3min fácil)", km: "12km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "90min Z2", km: "14km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "35min Z1", km: "5km", intensidade: "Z1" },
      ]},
      { sem: 6, treinos: [
        { dia: "Ter", tipo: "Progressivo", desc: "55min progressivo", km: "10km", intensidade: "Z2-Z4" },
        { dia: "Qui", tipo: "Tiros longos", desc: "4x (3km em Z4 + 3min fácil)", km: "14km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "100min Z2", km: "16km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "40min Z1", km: "5km", intensidade: "Z1" },
      ]},
      { sem: 7, treinos: [
        { dia: "Ter", tipo: "Corrida base", desc: "40min leve — SEMANA DE RECUPERAÇÃO", km: "7km", intensidade: "Z2" },
        { dia: "Qui", tipo: "Strides", desc: "30min leve + 8x strides", km: "6km", intensidade: "Z2" },
        { dia: "Sáb", tipo: "Longão leve", desc: "70min Z2", km: "11km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Descanso", desc: "Descanse", km: "—", intensidade: "—" },
      ]},
      { sem: 8, treinos: [
        { dia: "Ter", tipo: "Tempo run", desc: "15min leve + 35min Z3 + 10min leve", km: "10km", intensidade: "Z3" },
        { dia: "Qui", tipo: "Intervalado", desc: "6x (2km em Z4 + 3min fácil)", km: "14km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "110min Z2 — pico de volume", km: "17km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "40min Z1", km: "5km", intensidade: "Z1" },
      ]},
      { sem: 9, treinos: [
        { dia: "Ter", tipo: "Tempo run", desc: "15min leve + 40min Z3 + 10min leve", km: "11km", intensidade: "Z3" },
        { dia: "Qui", tipo: "Tiros", desc: "4x (3km no ritmo de meia + 3min fácil)", km: "15km", intensidade: "Z4" },
        { dia: "Sáb", tipo: "Longão", desc: "120min Z2 — MAIOR LONGÃO", km: "19km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Regenerativo", desc: "40min Z1", km: "5km", intensidade: "Z1" },
      ]},
      { sem: 10, treinos: [
        { dia: "Ter", tipo: "Corrida leve", desc: "40min Z2 — SEMANA DE TAPER", km: "7km", intensidade: "Z2" },
        { dia: "Qui", tipo: "Strides", desc: "30min Z2 + 6x strides", km: "6km", intensidade: "Z2" },
        { dia: "Sáb", tipo: "Longão leve", desc: "75min Z2", km: "12km", intensidade: "Z2" },
        { dia: "Dom", tipo: "Descanso", desc: "Descanse e se hidrate", km: "—", intensidade: "—" },
      ]},
      { sem: 11, treinos: [
        { dia: "Ter", tipo: "Corrida leve", desc: "35min Z2", km: "6km", intensidade: "Z2" },
        { dia: "Qui", tipo: "Ritmo de prova", desc: "20min leve + 10min no ritmo da meia + 10min leve", km: "7km", intensidade: "Z2-Z4" },
        { dia: "Sáb", tipo: "Corrida leve", desc: "50min bem leve", km: "8km", intensidade: "Z1-Z2" },
        { dia: "Dom", tipo: "Descanso", desc: "Descanse", km: "—", intensidade: "—" },
      ]},
      { sem: 12, treinos: [
        { dia: "Ter", tipo: "Corrida leve", desc: "25min muito leve", km: "4km", intensidade: "Z1-Z2" },
        { dia: "Qui", tipo: "Ativação", desc: "15min leve + 4x strides suaves", km: "3km", intensidade: "Z2" },
        { dia: "Sáb/Dom", tipo: "🏁 MEIA MARATONA", desc: "CORRER 21KM! Você chegou lá!", km: "21km", intensidade: "Z3-Z4" },
        { dia: "", tipo: "", desc: "", km: "", intensidade: "" },
      ]},
    ],
  },
];

const INTENSIDADE_CORES: Record<string, string> = {
  "Z1": "#3B82F6", "Z2": "#22C55E", "Z1-Z2": "#22C55E",
  "Z2-Z3": "#A3E635", "Z3": "#EAB308", "Z2-Z4": "#F97316",
  "Z3-Z4": "#F97316", "Z4": "#F97316", "Z4-Z5": "#EF4444",
  "Z5": "#EF4444", "—": "#8B949E",
};

export default function PlanosTreinoPage(): React.JSX.Element {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [planoAtivo, setPlanoAtivo] = useState<string | null>(null);
  const [semanaAberta, setSemanaAberta] = useState<number | null>(1);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email);
      if (user?.email) {
        supabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single()
          .then(({ data }) => setIsAdmin(!!data));
      }
    });
  }, []); // eslint-disable-line

  const plano = PLANOS.find(p => p.id === planoAtivo);

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-12" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
              style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
              📋 FERRAMENTAS
            </div>
            <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
              PLANOS DE <span style={{ color: "#5CC800" }}>TREINO</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>
              Programas semana a semana para todos os níveis. Gratuito, sem aplicativo.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

          {!planoAtivo ? (
            // Grid de seleção de planos
            <div className="grid gap-4 sm:grid-cols-3">
              {PLANOS.map(p => (
                <button key={p.id} onClick={() => { setPlanoAtivo(p.id); setSemanaAberta(1); }}
                  className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:-translate-y-1 hover:shadow-2xl"
                  style={{ background: "#161B22", border: `1px solid ${p.corBorder}` }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${p.cor}, transparent)` }} />
                  <span className="text-4xl block mb-3">{p.icon}</span>
                  <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-black mb-2"
                    style={{ background: p.corBg, color: p.cor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    {p.nivel}
                  </div>
                  <h3 className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{p.titulo}</h3>
                  <p className="mt-1 text-xs" style={{ color: "#8B949E" }}>{p.desc}</p>
                  <div className="mt-4 flex gap-3">
                    <div className="rounded-lg px-2.5 py-1.5" style={{ background: "#21262D" }}>
                      <p className="text-xs font-black" style={{ color: p.cor, fontFamily: "'Barlow Condensed', sans-serif" }}>{p.semanas} sem.</p>
                    </div>
                    <div className="rounded-lg px-2.5 py-1.5" style={{ background: "#21262D" }}>
                      <p className="text-xs font-black" style={{ color: p.cor, fontFamily: "'Barlow Condensed', sans-serif" }}>{p.diasSemana}x/sem</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-black transition-transform group-hover:translate-x-1" style={{ color: p.cor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    VER PLANO →
                  </p>
                </button>
              ))}
            </div>
          ) : plano ? (
            // Plano aberto
            <div className="space-y-4">
              {/* Header do plano */}
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${plano.corBorder}` }}>
                <div className="relative overflow-hidden px-6 py-6" style={{ background: `linear-gradient(135deg, ${plano.cor}10, #161B22)` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{plano.icon}</span>
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black"
                          style={{ background: plano.corBg, color: plano.cor, border: `1px solid ${plano.corBorder}`, fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {plano.nivel}
                        </div>
                      </div>
                      <h2 className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{plano.titulo}</h2>
                      <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>{plano.desc}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { label: "OBJETIVO", value: plano.objetivo },
                          { label: "DURAÇÃO", value: `${plano.semanas} semanas` },
                          { label: "FREQ.", value: `${plano.diasSemana}x/semana` },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl px-3 py-1.5" style={{ background: "#21262D" }}>
                            <p className="text-xs font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>{item.label}</p>
                            <p className="text-sm font-black" style={{ color: plano.cor, fontFamily: "'Barlow Condensed', sans-serif" }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setPlanoAtivo(null)}
                      className="shrink-0 rounded-xl px-4 py-2 text-xs font-black transition-all hover:brightness-110"
                      style={{ background: "#21262D", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ← VOLTAR
                    </button>
                  </div>
                </div>
              </div>

              {/* Semanas */}
              <div className="space-y-2">
                {plano.semanas_plano.map((semana) => (
                  <div key={semana.sem} className="rounded-2xl overflow-hidden" style={{ border: semanaAberta === semana.sem ? `1px solid ${plano.cor}50` : "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Header semana */}
                    <button className="w-full flex items-center justify-between px-5 py-4 transition-all"
                      style={{ background: semanaAberta === semana.sem ? plano.corBg : "#161B22" }}
                      onClick={() => setSemanaAberta(semanaAberta === semana.sem ? null : semana.sem)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg font-black text-sm"
                          style={{ background: semanaAberta === semana.sem ? plano.cor : "#21262D", color: semanaAberta === semana.sem ? "#fff" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {semana.sem}
                        </div>
                        <div className="text-left">
                          <p className="font-black text-sm" style={{ color: semanaAberta === semana.sem ? plano.cor : "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                            SEMANA {semana.sem}
                            {semana.sem % 4 === 0 && <span className="ml-2 text-xs" style={{ color: "#FFB800" }}>— RECUPERAÇÃO</span>}
                          </p>
                          <p className="text-xs" style={{ color: "#8B949E" }}>
                            {semana.treinos.filter(t => t.tipo).length} treinos
                          </p>
                        </div>
                      </div>
                      <span style={{ color: "#8B949E" }}>{semanaAberta === semana.sem ? "▲" : "▼"}</span>
                    </button>

                    {/* Treinos da semana */}
                    {semanaAberta === semana.sem && (
                      <div className="divide-y" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        {semana.treinos.filter(t => t.tipo).map((treino, ti) => (
                          <div key={ti} className="flex items-start gap-4 px-5 py-4" style={{ background: ti % 2 === 0 ? "#161B22" : "#1a1f26" }}>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                              style={{ background: "#21262D", color: plano.cor, fontFamily: "'Barlow Condensed', sans-serif", border: `1px solid ${plano.corBorder}` }}>
                              {treino.dia.substring(0, 3)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{treino.tipo}</p>
                                {treino.intensidade !== "—" && (
                                  <span className="rounded-lg px-2 py-0.5 text-xs font-black"
                                    style={{ background: (INTENSIDADE_CORES[treino.intensidade] || "#8B949E") + "20", color: INTENSIDADE_CORES[treino.intensidade] || "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                    {treino.intensidade}
                                  </span>
                                )}
                                {treino.km && treino.km !== "—" && (
                                  <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: "#21262D", color: "#8B949E" }}>{treino.km}</span>
                                )}
                              </div>
                              <p className="text-xs" style={{ color: "#8B949E" }}>{treino.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA criar treino em grupo */}
              <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
                <p className="font-black text-base mb-1" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>💡 SEGUINDO ESTE PLANO?</p>
                <p className="text-sm mb-4" style={{ color: "#8B949E" }}>Crie um treino em grupo e convide amigos para seguir junto. Muito mais fácil!</p>
                <Link href="/encontros" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  ⚡ CRIAR TREINO EM GRUPO
                </Link>
              </div>
            </div>
          ) : null}

          {/* Links ferramentas */}
          {!planoAtivo && (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/calculadora-pace" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
                <p className="text-xl mb-1">⏱</p>
                <p className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>CALCULADORA PACE</p>
                <p className="text-xs" style={{ color: "#8B949E" }}>Ritmo, tempo, distância</p>
              </Link>
              <Link href="/calculadora-fc" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.2)" }}>
                <p className="text-xl mb-1">❤️</p>
                <p className="font-black text-sm" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>CALCULADORA FC</p>
                <p className="text-xs" style={{ color: "#8B949E" }}>Zonas Z1-Z5</p>
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
