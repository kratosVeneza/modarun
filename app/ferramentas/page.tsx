"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/Header";
import {
  Timer, Heart, ClipboardList, TrendingUp, Share2,
  Users, Flag, ArrowRight,
} from "lucide-react";

const FERRAMENTAS = [
  {
    href: "/calculadora-pace",
    Icon: Timer,
    titulo: "CALCULADORA DE PACE",
    desc: "Calcule seu ritmo, tempo de prova ou distância. Previsão para 1km, 5km, 10km, meia e maratona.",
    tags: ["Pace", "Tempo", "Distância"],
    cor: "#5CC800",
    corBg: "rgba(92,200,0,0.08)",
    corBorder: "rgba(92,200,0,0.2)",
  },
  {
    href: "/calculadora-fc",
    Icon: Heart,
    titulo: "ZONAS DE FREQUÊNCIA CARDÍACA",
    desc: "Descubra suas zonas Z1-Z5 com base na sua idade e FC de repouso. Métodos Tanaka, clássico e Karvonen.",
    tags: ["Z1-Z5", "FC Máxima", "Karvonen"],
    cor: "#FF6B00",
    corBg: "rgba(255,107,0,0.08)",
    corBorder: "rgba(255,107,0,0.2)",
  },
  {
    href: "/planos-treino",
    Icon: ClipboardList,
    titulo: "PLANOS DE TREINO",
    desc: "Programas semana a semana: do zero ao 5km, de 5km para 10km, e rumo à meia maratona.",
    tags: ["Zero ao 5km", "10km", "Meia Maratona"],
    cor: "#FFB800",
    corBg: "rgba(255,184,0,0.08)",
    corBorder: "rgba(255,184,0,0.2)",
  },
  {
    href: "/historico",
    Icon: TrendingUp,
    titulo: "HISTÓRICO DE TREINOS",
    desc: "Registre suas atividades e acompanhe sua evolução com gráficos de distância, tempo e frequência cardíaca.",
    tags: ["Evolução", "Gráficos", "Registros"],
    cor: "#5CC800",
    corBg: "rgba(92,200,0,0.08)",
    corBorder: "rgba(92,200,0,0.2)",
  },
  {
    href: "/compartilhar-resultado",
    Icon: Share2,
    titulo: "COMPARTILHAR RESULTADO",
    desc: "Gere uma imagem bonita com seus dados de treino para compartilhar nos Stories, Instagram ou WhatsApp.",
    tags: ["Stories", "Instagram", "WhatsApp"],
    cor: "#FF6B00",
    corBg: "rgba(255,107,0,0.08)",
    corBorder: "rgba(255,107,0,0.2)",
  },
];

export default function FerramentasPage(): React.JSX.Element {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email);
      if (user?.email) {
        supabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single()
          .then(({ data }) => setIsAdmin(!!data));
      }
    });
  }, []); // eslint-disable-line

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-14"
          style={{ background: "linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)" }}>
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,184,0,0.12), transparent 70%)" }} />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(92,200,0,0.08), transparent 70%)" }} />
          <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFB800" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black"
              style={{ background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.3)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
              <Timer size={13} strokeWidth={2.5} />
              FERRAMENTAS DO CORREDOR
            </div>
            <h1 className="text-5xl font-black sm:text-6xl"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1, letterSpacing: "-0.01em" }}>
              TUDO QUE VOCÊ<br />
              <span style={{ color: "#FFB800" }}>PRECISA</span>{" "}
              <span style={{ color: "#5CC800" }}>PARA</span><br />
              CORRER MELHOR.
            </h1>
            <p className="mt-4 max-w-xl text-base" style={{ color: "#8B949E" }}>
              Calculadoras, planos de treino e ferramentas gratuitas para corredores de todos os níveis.
            </p>
          </div>
        </section>

        {/* Grid ferramentas */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {FERRAMENTAS.map((f) => (
                <Link key={f.href} href={f.href}
                  className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
                  style={{ background: "#161B22", border: "1px solid " + f.corBorder }}>

                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                    style={{ background: "linear-gradient(90deg, " + f.cor + ", transparent)" }} />
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: "radial-gradient(circle, " + f.cor + "15, transparent)" }} />

                  <div className="relative">
                    {/* Ícone */}
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: f.corBg, border: "1px solid " + f.corBorder }}>
                      <f.Icon size={26} color={f.cor} strokeWidth={1.75} />
                    </div>

                    <h2 className="text-xl font-black leading-tight mb-2"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", color: f.cor, letterSpacing: "0.03em" }}>
                      {f.titulo}
                    </h2>

                    <p className="text-sm leading-relaxed mb-4" style={{ color: "#8B949E" }}>
                      {f.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {f.tags.map(tag => (
                        <span key={tag} className="rounded-lg px-2.5 py-1 text-xs font-black"
                          style={{ background: f.corBg, color: f.cor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: f.cor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                      ACESSAR <ArrowRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Banner treinos */}
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl p-8"
              style={{ background: "linear-gradient(135deg, #161B22, #21262D)", border: "1px solid rgba(92,200,0,0.15)" }}>
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(92,200,0,0.1), transparent)" }} />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black mb-1 flex items-center gap-1.5"
                    style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                    <Users size={13} strokeWidth={2.5} />
                    QUER TREINAR EM GRUPO?
                  </p>
                  <h3 className="text-2xl font-black"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                    Crie ou encontre treinos<br />na sua cidade
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>
                    Organize encontros, marque o ponto de largada no mapa e convide seus amigos.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/encontros"
                    className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:scale-105 hover:brightness-110"
                    style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    <Users size={16} strokeWidth={2.5} />
                    VER TREINOS
                  </Link>
                  <Link href="/eventos"
                    className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:scale-105"
                    style={{ border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    <Flag size={16} strokeWidth={2} />
                    VER EVENTOS
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
