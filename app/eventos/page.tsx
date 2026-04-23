"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/client";

type Evento = {
  id: number; nome: string; cidade: string; estado: string;
  data_evento: string; distancia?: string; local?: string;
  link_inscricao?: string; destaque?: boolean;
};

const ESTADOS_NOMES: Record<string, string> = {
  AC:"Acre", AL:"Alagoas", AP:"Amapá", AM:"Amazonas", BA:"Bahia", CE:"Ceará",
  DF:"Distrito Federal", ES:"Espírito Santo", GO:"Goiás", MA:"Maranhão",
  MT:"Mato Grosso", MS:"Mato Grosso do Sul", MG:"Minas Gerais", PA:"Pará",
  PB:"Paraíba", PR:"Paraná", PE:"Pernambuco", PI:"Piauí", RJ:"Rio de Janeiro",
  RN:"Rio Grande do Norte", RS:"Rio Grande do Sul", RO:"Rondônia", RR:"Roraima",
  SC:"Santa Catarina", SP:"São Paulo", SE:"Sergipe", TO:"Tocantins", BR:"Brasil",
};

function formatarData(data: string) {
  if (!data) return "—";
  try {
    const [ano, mes, dia] = String(data).split("-");
    return `${dia}/${mes}/${ano}`;
  } catch { return String(data); }
}

export default function EventosPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authSupabase = createClient();

  const [userEmail, setUserEmail] = useState<string|undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState(searchParams.get("cidade") || "");
  const [estadoSelecionado, setEstadoSelecionado] = useState(searchParams.get("estado") || "");
  const [cidadePorEstado, setCidadePorEstado] = useState<Record<string, string>>({});

  const cidadeFiltro = searchParams.get("cidade") || "";
  const estadoFiltro = searchParams.get("estado") || "";

  useEffect(() => {
    async function carregarUser() {
      const { data: { user } } = await authSupabase.auth.getUser();
      setUserEmail(user?.email);
      if (user?.email) {
        const { data } = await authSupabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single();
        setIsAdmin(!!data);
      }
    }
    carregarUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function carregarEventos() {
      setLoading(true);
      let query = supabase.from("eventos").select("*").order("data_evento", { ascending: true });
      if (cidadeFiltro) query = query.ilike("cidade", `%${cidadeFiltro}%`);
      if (estadoFiltro) query = query.ilike("estado", `%${estadoFiltro}%`);
      const { data, error: err } = await query;
      if (err) setError(err.message);
      else setEventos(data || []);
      setLoading(false);
    }
    carregarEventos();
  }, [cidadeFiltro, estadoFiltro]); // eslint-disable-line react-hooks/exhaustive-deps

  // Agrupar por estado
  const eventosPorEstado = useMemo(() => {
    const filtrados = eventos.filter(e => {
      if (busca.trim() && !e.cidade.toLowerCase().includes(busca.toLowerCase()) && !e.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (estadoSelecionado && e.estado !== estadoSelecionado) return false;
      return true;
    });

    const grupos: Record<string, Evento[]> = {};
    filtrados.forEach(e => {
      const uf = e.estado || "BR";
      if (!grupos[uf]) grupos[uf] = [];
      grupos[uf].push(e);
    });
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  }, [eventos, busca, estadoSelecionado]);

  // Estados disponíveis nos eventos
  const estadosDisponiveis = useMemo(() => {
    const ufs = [...new Set(eventos.map(e => e.estado).filter(Boolean))].sort();
    return ufs;
  }, [eventos]);

  const totalFiltrado = eventosPorEstado.reduce((acc, [, evs]) => acc + evs.length, 0);

  function limparFiltros() {
    setBusca(""); setEstadoSelecionado(""); router.push("/eventos");
  }

  const inp = { background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3", borderRadius: "12px", padding: "10px 14px", fontSize: "14px", outline: "none" } as React.CSSProperties;

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="min-h-screen px-4 py-8" style={{ background: "#0D1117" }}>
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl px-6 py-10" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
            <div className="relative max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
                style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                🏁 EVENTOS DE CORRIDA
              </div>
              <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
                PRÓXIMAS CORRIDAS<br /><span style={{ color: "#5CC800" }}>NO BRASIL</span>
              </h1>
              <p className="mt-3 text-sm" style={{ color: "#8B949E" }}>Encontre corridas, provas de rua e maratonas perto de você.</p>
              <a href="/sugerir-evento" className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
                style={{ background: "rgba(92,200,0,0.15)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                🏁 SUGERIR UM EVENTO
              </a>
            </div>
          </section>

          {/* Filtros */}
          <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span>🔍</span>
              <h2 className="font-black text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.05em" }}>FILTRAR EVENTOS</h2>
              {(busca || estadoSelecionado) && (
                <button onClick={limparFiltros} className="ml-auto rounded-lg px-2.5 py-1 text-xs font-black"
                  style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ✕ LIMPAR
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="text" placeholder="Buscar por nome ou cidade..." value={busca} onChange={e => setBusca(e.target.value)}
                style={{ ...inp, flex: 1 }} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
              <select value={estadoSelecionado} onChange={e => setEstadoSelecionado(e.target.value)}
                style={{ ...inp, width: "auto", minWidth: "140px" }}>
                <option value="">Todos os estados</option>
                {estadosDisponiveis.map(uf => (
                  <option key={uf} value={uf}>{uf} — {ESTADOS_NOMES[uf] || uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Abas de estados rápidos */}
          {estadosDisponiveis.length > 0 && !loading && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setEstadoSelecionado("")}
                className="shrink-0 rounded-xl px-3 py-2 text-xs font-black transition-all"
                style={{ background: estadoSelecionado === "" ? "#5CC800" : "rgba(92,200,0,0.08)", color: estadoSelecionado === "" ? "#0D1117" : "#8B949E", border: estadoSelecionado === "" ? "1px solid #5CC800" : "1px solid rgba(92,200,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                🇧🇷 TODOS ({eventos.length})
              </button>
              {estadosDisponiveis.map(uf => {
                const count = eventos.filter(e => e.estado === uf).length;
                const ativo = estadoSelecionado === uf;
                return (
                  <button key={uf} onClick={() => setEstadoSelecionado(uf === estadoSelecionado ? "" : uf)}
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-black transition-all"
                    style={{ background: ativo ? "#5CC800" : "rgba(92,200,0,0.08)", color: ativo ? "#0D1117" : "#8B949E", border: ativo ? "1px solid #5CC800" : "1px solid rgba(92,200,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {uf} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
            </div>
          )}

          {/* Erro */}
          {error && <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)" }}>Erro: {error}</div>}

          {/* Vazio */}
          {!loading && !error && totalFiltrado === 0 && (
            <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.2)" }}>
              <p className="text-4xl mb-2">🏁</p>
              <p className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>NENHUM EVENTO ENCONTRADO</p>
              <p className="text-sm mt-1 mb-4" style={{ color: "#8B949E" }}>{busca || estadoSelecionado ? "Tente outro filtro" : "Nenhum evento cadastrado ainda"}</p>
              {(busca || estadoSelecionado) && (
                <button onClick={limparFiltros} className="rounded-xl px-4 py-2 text-sm font-black"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  VER TODOS
                </button>
              )}
            </div>
          )}

          {/* Eventos agrupados por estado */}
          {!loading && !error && eventosPorEstado.map(([uf, evs]) => (
            <section key={uf} className="space-y-3">
              {/* Header do estado */}
              <div className="flex items-center gap-3 sticky top-[57px] z-30 py-2 -mx-4 px-4"
                style={{ background: "rgba(13,17,23,0.97)", backdropFilter: "blur(12px)" }}>
                <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
                <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                  {uf} — {ESTADOS_NOMES[uf] || uf}
                </h2>
                <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {evs.length}
                </span>
              </div>

              {/* Cards dos eventos com filtro por cidade */}
              {(() => {
                const cidades = [...new Set(evs.map(e => e.cidade))].sort();
                const cidadeAtiva = cidadePorEstado[uf] || "";
                const evsFiltrados = cidadeAtiva ? evs.filter(e => e.cidade === cidadeAtiva) : evs;
                return (
                  <>
                    {cidades.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                        <button onClick={() => setCidadePorEstado(prev => ({ ...prev, [uf]: "" }))}
                          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition-all"
                          style={{ background: cidadeAtiva === "" ? "#FF6B00" : "rgba(255,107,0,0.08)", color: cidadeAtiva === "" ? "#fff" : "#8B949E", border: cidadeAtiva === "" ? "1px solid #FF6B00" : "1px solid rgba(255,107,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          TODAS ({evs.length})
                        </button>
                        {cidades.map(c => (
                          <button key={c} onClick={() => setCidadePorEstado(prev => ({ ...prev, [uf]: prev[uf] === c ? "" : c }))}
                            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition-all"
                            style={{ background: cidadeAtiva === c ? "#FF6B00" : "rgba(255,107,0,0.08)", color: cidadeAtiva === c ? "#fff" : "#8B949E", border: cidadeAtiva === c ? "1px solid #FF6B00" : "1px solid rgba(255,107,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {c} ({evs.filter(e => e.cidade === c).length})
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3">
                    {evsFiltrados.map(evento => (
                  <article key={evento.id} className="relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#5CC800,#FF6B00)" }} />
                    <div className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{evento.nome}</h3>
                            {evento.destaque && <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>⭐ DESTAQUE</span>}
                          </div>
                          <p className="text-xs" style={{ color: "#8B949E" }}>📍 {evento.cidade} — {evento.estado}</p>
                        </div>
                        {evento.link_inscricao && (
                          <a href={evento.link_inscricao} target="_blank" rel="noreferrer"
                            className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition-all hover:brightness-110"
                            style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                            INSCREVER-SE →
                          </a>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "#21262D", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          📅 {formatarData(String(evento.data_evento))}
                        </span>
                        {evento.distancia && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "#21262D", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>📏 {evento.distancia}</span>}
                        {evento.local && <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "#21262D", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>📌 {evento.local}</span>}
                      </div>
                    </div>
                  </article>
                ))}
                    </div>
                  </>
                );
              })()}
            </section>
          ))}

          {/* CTA loja */}
          {!loading && totalFiltrado > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>SE PREPARANDO PARA UMA PROVA? 🏅</p>
                  <p className="text-sm mt-0.5" style={{ color: "#8B949E" }}>Veja os kits recomendados pela Moda Run.</p>
                </div>
                <a href="/loja" className="shrink-0 rounded-xl px-5 py-3 text-sm font-black transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  🛒 VER LOJA
                </a>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
