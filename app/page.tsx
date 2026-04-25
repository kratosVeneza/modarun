import React from "react";
import Header from "@/components/Header";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Flag, Users, ShoppingBag, Timer, Heart, ClipboardList, TrendingUp, Share2, ArrowRight, Zap, Star, MapPin } from "lucide-react";

export default async function HomePage(): Promise<React.JSX.Element> {
  const { user, isAdmin } = await getAdminStatus();
  // Cliente autenticado para queries com RLS (eventos salvos, cidades favoritas)
  const supabaseAuth = user ? await createClient() : null;

  const hoje = new Date().toISOString().split("T")[0];

  const [{ count: totalTreinos }, { count: totalParticipantes }, { data: proximosTreinos }, { data: proximosEventos }] = await Promise.all([
    supabase.from("encontros").select("*", { count: "exact", head: true }),
    supabase.from("encontro_participantes").select("*", { count: "exact", head: true }),
    supabase.from("encontros").select("id, titulo, cidade, estado, data_encontro, horario, tipo_treino, km_planejado, distancia").order("data_encontro", { ascending: true }).limit(3),
    supabase.from("eventos").select("id, nome, cidade, estado, data_evento, distancia").gte("data_evento", hoje).order("data_evento", { ascending: true }).limit(2),
  ]);

  // Eventos personalizados para usuário logado
  type EventoPersonalizado = { id: number; nome: string; cidade: string; estado: string; data_evento: string; distancia?: string; link_inscricao?: string };
  let eventosPersonalizados: EventoPersonalizado[] = [];
  let eventosFavoritados: EventoPersonalizado[] = [];
  let cidadesFavoritas: { cidade: string; estado: string }[] = [];

  if (user) {
    const { data: cidades } = await (supabaseAuth || supabase)
      .from("user_cidades_interesse")
      .select("cidade, estado")
      .eq("user_id", user.id);

    cidadesFavoritas = cidades || [];

    if (cidadesFavoritas.length > 0) {
      // Buscar eventos nas cidades favoritas
      const cidadesNomes = cidadesFavoritas.map(c => c.cidade.toLowerCase());
      const { data: evPers } = await supabase
        .from("eventos")
        .select("id, nome, cidade, estado, data_evento, distancia, link_inscricao")
        .gte("data_evento", hoje)
        .order("data_evento", { ascending: true })
        .limit(20);

      // Filtrar pelos que são das cidades favoritas
      eventosPersonalizados = (evPers || []).filter(e =>
        cidadesNomes.some(c => e.cidade?.toLowerCase().includes(c))
      );
    }

    // Eventos salvos com bookmark — seção separada
    const { data: salvos } = await (supabaseAuth || supabase)
      .from("user_eventos_salvos")
      .select("eventos(id, nome, cidade, estado, data_evento, distancia, link_inscricao)")
      .eq("user_id", user.id)
      .limit(6);

    eventosFavoritados = (salvos || [])
      .map((s: { eventos: EventoPersonalizado | EventoPersonalizado[] | null }) =>
        Array.isArray(s.eventos) ? s.eventos[0] : s.eventos
      )
      .filter((e): e is EventoPersonalizado => !!e && e.data_evento >= hoje)
      .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  }

  function formatarData(data: string) {
    if (!data) return "—";
    const [, mes, dia] = String(data).split("-");
    return `${dia}/${mes}`;
  }

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* HERO */}
        <section className="relative overflow-hidden px-4 py-20 sm:py-32" style={{ background: "linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)" }}>
          {/* Decorações */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-40 top-0 h-[600px] w-[600px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent 70%)" }} />
            <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #FF6B00, transparent 70%)" }} />
            {/* Linhas decorativas */}
            <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#5CC800" strokeWidth="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold" style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                ⚡ RUNNING & PERFORMANCE
              </div>

              <h1 className="text-5xl font-black leading-none sm:text-7xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}>
                <span style={{ color: "#E6EDF3" }}>CORRA NA</span><br />
                <span style={{ color: "#5CC800" }}>MODA.</span>{" "}
                <span style={{ color: "#FF6B00" }}>VENÇA</span><br />
                <span style={{ color: "#E6EDF3" }}>COM ESTILO.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg" style={{ color: "#8B949E" }}>
                Organize treinos em grupo, descubra provas no Brasil inteiro e encontre os equipamentos perfeitos para cada corrida.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {user ? (
                  <>
                    <Link href="/encontros"
                      className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black transition-all hover:scale-105 hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", fontSize: "15px" }}>
                      ⚡ VER TREINOS
                    </Link>
                    <Link href="/perfil"
                      className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black transition-all hover:scale-105"
                      style={{ border: "2px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", fontSize: "15px" }}>
                      👤 MEU PERFIL
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/cadastro"
                      className="flex items-center gap-2 rounded-xl px-6 py-3.5 font-black transition-all hover:scale-105 hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", fontSize: "15px", boxShadow: "0 0 30px rgba(92,200,0,0.3)" }}>
                      🚀 CRIAR CONTA GRÁTIS
                    </Link>
                    <Link href="/encontros"
                      className="flex items-center gap-2 rounded-xl px-6 py-3.5 font-black transition-all hover:scale-105"
                      style={{ border: "2px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", fontSize: "15px" }}>
                      ⚡ VER TREINOS
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap gap-8">
                {[
                  { v: totalTreinos || 0, l: "Treinos criados" },
                  { v: totalParticipantes || 0, l: "Confirmações" },
                  { v: "∞", l: "Quilômetros pela frente" },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: i === 0 ? "#5CC800" : i === 1 ? "#FF6B00" : "#FFB800" }}>{s.v}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRÓXIMOS TREINOS */}
        <section className="px-4 py-12" style={{ background: "#161B22" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full" style={{ background: "#5CC800" }} />
                <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>PRÓXIMOS TREINOS</h2>
              </div>
              <Link href="/encontros" className="text-xs font-bold transition hover:brightness-110" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                VER TODOS →
              </Link>
            </div>

            {!proximosTreinos || proximosTreinos.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "#21262D", border: "1px dashed rgba(92,200,0,0.2)" }}>
                <p className="text-4xl mb-2">🏃</p>
                <p className="font-semibold" style={{ color: "#8B949E" }}>Nenhum treino ainda.</p>
                <Link href="/encontros" className="mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-black"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  CRIAR PRIMEIRO TREINO
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {proximosTreinos.map((t) => (
                  <Link key={t.id} href={`/treinos/${t.id}`}
                    className="group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-2xl"
                    style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.1)" }}>
                    <div className="absolute top-0 left-0 h-0.5 w-full" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-black truncate text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{t.titulo}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>📍 {t.cidade} - {t.estado}</p>
                      </div>
                      <span className="ml-2 shrink-0 rounded-lg px-2 py-1 text-xs font-black" style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {formatarData(String(t.data_encontro))}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.tipo_treino && <span className="rounded-lg px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00" }}>{t.tipo_treino}</span>}
                      {(t.km_planejado || t.distancia) && <span className="rounded-lg px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800" }}>{t.km_planejado ? `${t.km_planejado}km` : t.distancia}</span>}
                    </div>
                    <p className="mt-3 text-xs font-bold" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{t.horario} — ABRIR →</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CORRIDAS FAVORITADAS ────────────────────────────── */}
        {user && eventosFavoritados.length > 0 && (
          <section className="px-4 py-12" style={{ background: "#161B22" }}>
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 rounded-full" style={{ background: "#FFB800" }} />
                  <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                    MINHAS CORRIDAS
                  </h2>
                  <span className="rounded-full px-2 py-0.5 text-xs font-black flex items-center gap-1"
                    style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ⭐ {eventosFavoritados.length} salva{eventosFavoritados.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Link href="/perfil" className="text-xs font-bold"
                  style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  VER TODAS →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {eventosFavoritados.map(e => {
                  const [ano, mes, dia] = String(e.data_evento).split("-");
                  const dataFmt = `${dia}/${mes}/${ano}`;
                  return (
                    <div key={e.id} className="relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
                      style={{ background: "#21262D", border: "1px solid rgba(255,184,0,0.2)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: "linear-gradient(90deg, #FFB800, #FF6B00)" }} />
                      {/* Badge favorito */}
                      <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-lg"
                        style={{ background: "rgba(255,184,0,0.2)", color: "#FFB800" }}>
                        ⭐
                      </div>
                      <div className="p-4 pr-10">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {dataFmt}
                          </span>
                          {e.distancia && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                              style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {e.distancia}
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-sm leading-tight mb-1.5"
                          style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {e.nome}
                        </h3>
                        <p className="text-xs mb-3 flex items-center gap-1" style={{ color: "#8B949E" }}>
                          📍 {e.cidade} — {e.estado}
                        </p>
                        {e.link_inscricao ? (
                          <a href={e.link_inscricao} target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-black transition-all hover:brightness-110"
                            style={{ background: "linear-gradient(135deg, #FFB800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
                            INSCREVER-SE →
                          </a>
                        ) : (
                          <Link href="/eventos"
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-black"
                            style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            VER DETALHES →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── EVENTOS DA SUA REGIÃO ────────────────────────────── */}
        {user && eventosPersonalizados.length > 0 && (
          <section className="px-4 py-12" style={{ background: "#0D1117" }}>
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 rounded-full" style={{ background: "#5CC800" }} />
                  <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                    NA SUA REGIÃO
                  </h2>
                  <span className="rounded-full px-2 py-0.5 text-xs font-black"
                    style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {cidadesFavoritas.map(c => c.cidade).join(", ")}
                  </span>
                </div>
                <Link href="/eventos" className="text-xs font-bold"
                  style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  VER TODOS →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {eventosPersonalizados.slice(0, 6).map(e => {
                  const [ano, mes, dia] = String(e.data_evento).split("-");
                  const dataFmt = `${dia}/${mes}/${ano}`;
                  return (
                    <div key={e.id} className="relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
                      style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.12)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: "linear-gradient(90deg, #5CC800, transparent)" }} />
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{dataFmt}</span>
                          {e.distancia && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                              style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {e.distancia}
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-sm leading-tight mb-1.5"
                          style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {e.nome}
                        </h3>
                        <p className="text-xs mb-3" style={{ color: "#8B949E" }}>📍 {e.cidade} — {e.estado}</p>
                        {e.link_inscricao ? (
                          <a href={e.link_inscricao} target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-black transition-all hover:brightness-110"
                            style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            INSCREVER-SE →
                          </a>
                        ) : (
                          <Link href="/eventos"
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-black"
                            style={{ background: "rgba(92,200,0,0.08)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            VER EVENTO →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <Link href="/perfil" className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ⚙️ Gerenciar cidades favoritas no perfil
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA adicionar cidade - para logados sem cidades favoritas */}
        {user && cidadesFavoritas.length === 0 && (
          <section className="px-4 py-8">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4"
                style={{ background: "#161B22", border: "1px dashed rgba(255,184,0,0.25)" }}>
                <div className="flex-1">
                  <p className="font-black text-base mb-0.5" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    📍 PERSONALIZE SUA PÁGINA INICIAL
                  </p>
                  <p className="text-sm" style={{ color: "#8B949E" }}>
                    Adicione suas cidades favoritas e veja eventos relevantes aqui.
                  </p>
                </div>
                <Link href="/perfil"
                  className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-black transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #FFB800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  CONFIGURAR CIDADES
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* PRÓXIMOS EVENTOS */}
        {proximosEventos && proximosEventos.length > 0 && (
          <section className="px-4 py-12" style={{ background: "#0D1117" }}>
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 rounded-full" style={{ background: "#FF6B00" }} />
                  <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>PRÓXIMAS PROVAS</h2>
                </div>
                <Link href="/eventos" className="text-xs font-bold" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>VER TODAS →</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {proximosEventos.map(e => (
                  <div key={e.id} className="flex items-center gap-4 rounded-2xl p-5" style={{ background: "#21262D", border: "1px solid rgba(255,107,0,0.15)" }}>
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl" style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)" }}>
                      <p className="text-lg font-black leading-none" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{formatarData(String(e.data_evento))}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black truncate" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>{e.nome}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>📍 {e.cidade} — {e.estado}</p>
                      {e.distancia && <p className="text-xs font-bold mt-0.5" style={{ color: "#FF6B00" }}>{e.distancia}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CARDS NAVEGAÇÃO */}
        <section className="px-4 py-12" style={{ background: "#161B22" }}>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {([
                { href: "/eventos", Icon: Flag, label: "EVENTOS", desc: "Corridas e provas no Brasil", color: "#FF6B00", bg: "rgba(255,107,0,0.1)", border: "rgba(255,107,0,0.2)" },
                { href: "/encontros", Icon: Zap, label: "TREINOS", desc: "Grupos de corrida na sua cidade", color: "#5CC800", bg: "rgba(92,200,0,0.1)", border: "rgba(92,200,0,0.2)" },
                { href: "/loja", Icon: ShoppingBag, label: "LOJA", desc: "Roupas, calçados e acessórios", color: "#FFB800", bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.2)" },
                { href: "/meus-treinos", Icon: ClipboardList, label: "MEUS TREINOS", desc: "Treinos que você organizou", color: "#5CC800", bg: "rgba(92,200,0,0.08)", border: "rgba(92,200,0,0.15)" },
              ] as { href: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>; label: string; desc: string; color: string; bg: string; border: string }[]).map((item) => (
                <Link key={item.href} href={item.href}
                  className="group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1"
                  style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                  <item.Icon size={28} strokeWidth={1.75} style={{ color: item.color, marginBottom: "12px" }} />
                  <h3 className="font-black text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: item.color, letterSpacing: "0.03em" }}>{item.label}</h3>
                  <p className="text-xs mt-1" style={{ color: "#8B949E" }}>{item.desc}</p>
                  <p className="mt-4 text-xs font-black transition-transform group-hover:translate-x-1" style={{ color: item.color, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>ACESSAR →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* BANNER LOJA */}
        <section className="px-4 py-12" style={{ background: "#0D1117" }}>
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12" style={{ background: "linear-gradient(135deg, #161B22 0%, #21262D 100%)", border: "1px solid rgba(92,200,0,0.2)" }}>
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
              <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #FF6B00, transparent)" }} />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                    🛒 MODA RUN STORE
                  </div>
                  <h2 className="text-3xl font-black sm:text-4xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                    EQUIPADO PARA<br /><span style={{ color: "#5CC800" }}>CORRER MELHOR?</span>
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>Conjuntos, calçados e acessórios selecionados para corredores.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run." target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    💬 WHATSAPP
                  </a>
                  <Link href="/loja"
                    className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm transition-all hover:scale-105"
                    style={{ border: "2px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                    VER LOJA →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FERRAMENTAS */}
        <section className="px-4 py-12" style={{ background: "#161B22" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-1 rounded-full" style={{ background: "#FFB800" }} />
              <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>FERRAMENTAS DO CORREDOR</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {([
                { href: "/calculadora-pace", Icon: Timer, label: "CALCULADORA DE PACE", desc: "Calcule ritmo, tempo e distância", color: "#5CC800", bg: "rgba(92,200,0,0.08)", border: "rgba(92,200,0,0.15)" },
                { href: "/calculadora-fc", Icon: Heart, label: "ZONAS DE FC", desc: "Zonas Z1-Z5 por frequência cardíaca", color: "#FF6B00", bg: "rgba(255,107,0,0.08)", border: "rgba(255,107,0,0.15)" },
                { href: "/planos-treino", Icon: ClipboardList, label: "PLANOS DE TREINO", desc: "Do zero ao 5km, 10km e meia", color: "#FFB800", bg: "rgba(255,184,0,0.08)", border: "rgba(255,184,0,0.15)" },
                { href: "/compartilhar-resultado", Icon: Share2, label: "COMPARTILHAR", desc: "Crie imagem para Instagram e WhatsApp", color: "#5CC800", bg: "rgba(92,200,0,0.08)", border: "rgba(92,200,0,0.15)" },
              ] as { href: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>; label: string; desc: string; color: string; bg: string; border: string }[]).map((item) => (
                <a key={item.href} href={item.href}
                  className="group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1"
                  style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                  <item.Icon size={28} strokeWidth={1.75} style={{ color: item.color, marginBottom: "12px" }} />
                  <h3 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: item.color, letterSpacing: "0.03em" }}>{item.label}</h3>
                  <p className="text-xs mt-1" style={{ color: "#8B949E" }}>{item.desc}</p>
                  <p className="mt-4 text-xs font-black transition-transform group-hover:translate-x-1" style={{ color: item.color, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>ACESSAR →</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA CADASTRO */}
        {!user && (
          <section className="px-4 py-16" style={{ background: "#161B22" }}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                PRONTO PARA<br /><span style={{ color: "#5CC800" }}>CORRER?</span>
              </h2>
              <p className="mt-3 text-base" style={{ color: "#8B949E" }}>Crie sua conta gratuita e junte-se à comunidade Moda Run.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/cadastro"
                  className="rounded-xl px-8 py-4 font-black text-base transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", boxShadow: "0 0 40px rgba(92,200,0,0.2)" }}>
                  🚀 CRIAR CONTA GRÁTIS
                </Link>
                <Link href="/login"
                  className="rounded-xl px-8 py-4 font-black text-base transition-all hover:scale-105"
                  style={{ border: "2px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  JÁ TENHO CONTA
                </Link>
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  );
}
