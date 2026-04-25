"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { Flag, Search, X, MapPin, Calendar, Ruler, Star, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck } from "lucide-react";
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


// ── Componente de Carrossel ───────────────────────────────────────────────
function CarrosselEventos({ eventos, isAdmin, eventosSalvosIds, onToggleSalvar, salvandoEvento }: { eventos: Evento[]; isAdmin: boolean; eventosSalvosIds: Set<number>; onToggleSalvar: (id: number) => void; salvandoEvento: number | null }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [podeEsquerda, setPodeEsquerda] = useState(false);
  const [podeDireita, setPodeDireita] = useState(true);

  function formatarData(data: string) {
    if (!data) return "—";
    try { const [ano, mes, dia] = String(data).split("-"); return `${dia}/${mes}/${ano}`; }
    catch { return String(data); }
  }

  const verificarScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setPodeEsquerda(el.scrollLeft > 10);
    setPodeDireita(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    verificarScroll();
    el.addEventListener("scroll", verificarScroll);
    return () => el.removeEventListener("scroll", verificarScroll);
  }, [verificarScroll, eventos]);

  function scrollPara(dir: "esq" | "dir") {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("article");
    const largura = card ? card.clientWidth + 12 : 300;
    el.scrollBy({ left: dir === "dir" ? largura * 2 : -largura * 2, behavior: "smooth" });
  }

  if (!eventos.length) return null;

  return (
    <div className="relative">
      {/* Seta esquerda */}
      {podeEsquerda && (
        <button onClick={() => scrollPara("esq")}
          className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 -translate-x-3 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110"
          style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800" }}>
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
      )}

      {/* Seta direita */}
      {podeDireita && (
        <button onClick={() => scrollPara("dir")}
          className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110"
          style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800" }}>
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      )}

      {/* Fades nas bordas */}
      {podeEsquerda && (
        <div className="absolute left-0 top-0 bottom-0 w-8 z-[5] pointer-events-none rounded-l-xl"
          style={{ background: "linear-gradient(90deg, #0D1117, transparent)" }} />
      )}
      {podeDireita && (
        <div className="absolute right-0 top-0 bottom-0 w-8 z-[5] pointer-events-none rounded-r-xl"
          style={{ background: "linear-gradient(270deg, #0D1117, transparent)" }} />
      )}

      {/* Scroll container */}
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {eventos.map(evento => (
          <article key={evento.id}
            className="relative flex-shrink-0 overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ width: "260px", background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
            {/* Linha topo */}
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: evento.destaque ? "linear-gradient(90deg,#FFB800,#FF6B00)" : "linear-gradient(90deg,#5CC800,transparent)" }} />

            <div className="p-4">
              {/* Bookmark button — canto superior direito */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSalvar(evento.id); }}
                disabled={salvandoEvento === evento.id}
                className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-110"
                title={eventosSalvosIds.has(evento.id) ? "Remover dos salvos" : "Salvar evento"}
                style={{ background: eventosSalvosIds.has(evento.id) ? "rgba(255,184,0,0.25)" : "rgba(255,255,255,0.07)", color: eventosSalvosIds.has(evento.id) ? "#FFB800" : "#8B949E", border: "1px solid " + (eventosSalvosIds.has(evento.id) ? "rgba(255,184,0,0.4)" : "rgba(255,255,255,0.08)") }}>
                {salvandoEvento === evento.id
                  ? <span className="h-3.5 w-3.5 block animate-spin rounded-full border-2 border-yellow-400/30 border-t-yellow-400" />
                  : eventosSalvosIds.has(evento.id) ? <BookmarkCheck size={14} strokeWidth={2} /> : <Bookmark size={14} strokeWidth={2} />
                }
              </button>

              {/* Data */}
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar size={11} color="#5CC800" strokeWidth={2} />
                <span className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {formatarData(String(evento.data_evento))}
                </span>
                {evento.destaque && (
                  <span className="ml-auto rounded-lg px-1.5 py-0.5 text-xs font-black"
                    style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px" }}>
                    DESTAQUE
                  </span>
                )}
              </div>

              {/* Nome */}
              <h3 className="font-black text-sm leading-tight mb-2"
                style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {evento.nome}
              </h3>

              {/* Local */}
              <p className="text-xs flex items-center gap-1 mb-3" style={{ color: "#8B949E" }}>
                <MapPin size={10} strokeWidth={2} />
                {evento.cidade} — {evento.estado}
              </p>

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {evento.distancia && (
                  <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold"
                    style={{ background: "#21262D", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Ruler size={10} strokeWidth={2} />{evento.distancia}
                  </span>
                )}
                {evento.local && (
                  <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"
                    style={{ background: "#21262D", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <MapPin size={10} strokeWidth={2} />{evento.local}
                  </span>
                )}
              </div>

              {/* Botão */}
              {evento.link_inscricao ? (
                <a href={evento.link_inscricao} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-black transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  INSCREVER-SE <ArrowRight size={12} strokeWidth={2.5} />
                </a>
              ) : (
                <div className="w-full rounded-xl py-2 text-center text-xs font-black"
                  style={{ background: "rgba(92,200,0,0.08)", color: "rgba(92,200,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  SEM LINK
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
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
  const [eventosSalvosIds, setEventosSalvosIds] = useState<Set<number>>(new Set());
  const [salvandoEvento, setSalvandoEvento] = useState<number | null>(null);
  const [estadosFiltroSalvos, setEstadosFiltroSalvos] = useState<string[]>([]);
  const [cidadesFiltroSalvas, setCidadesFiltroSalvas] = useState<string[]>([]);
  const [mostrarFiltroPersonalizado, setMostrarFiltroPersonalizado] = useState(false);
  const [salvandoFiltro, setSalvandoFiltro] = useState(false);

  const cidadeFiltro = searchParams.get("cidade") || "";
  const estadoFiltro = searchParams.get("estado") || "";

  useEffect(() => {
    async function carregarUser() {
      const { data: { user } } = await authSupabase.auth.getUser();
      setUserEmail(user?.email);
      if (user?.email) {
        const { data: adminData } = await authSupabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single();
        setIsAdmin(!!adminData);
        // Carregar IDs de eventos salvos
        const { data: salvos } = await authSupabase.from("user_eventos_salvos").select("evento_id").eq("user_id", user.id);
        if (salvos) setEventosSalvosIds(new Set(salvos.map((s: { evento_id: number }) => s.evento_id)));

        // Carregar cidades favoritas do usuário para pré-filtrar eventos
        const { data: cidadesFav } = await authSupabase
          .from("user_cidades_interesse")
          .select("cidade, estado")
          .eq("user_id", user.id);
        if (cidadesFav && cidadesFav.length > 0) {
          setEstadosFiltroSalvos([...new Set(cidadesFav.map((c: { estado: string }) => c.estado))]);
          setCidadesFiltroSalvas(cidadesFav.map((c: { cidade: string }) => c.cidade));
        }
      }
    }
    carregarUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function carregarEventos() {
      setLoading(true);
      const hoje = new Date().toISOString().split("T")[0];
      let query = supabase.from("eventos").select("*").gte("data_evento", hoje).order("data_evento", { ascending: true });
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

  // Seções de carrossel: destaques, essa semana, próximos 30 dias
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const em7dias = new Date(hoje); em7dias.setDate(hoje.getDate() + 7);
  const em30dias = new Date(hoje); em30dias.setDate(hoje.getDate() + 30);

  // Se o usuário tem estados favoritos, filtra os carrosséis por eles
  const temFavoritos = estadosFiltroSalvos.length > 0;

  function filtrarPorFavoritos(lista: Evento[]) {
    if (!temFavoritos) return lista;
    return lista.filter(e => estadosFiltroSalvos.includes(e.estado));
  }

  const destaques = useMemo(
    () => filtrarPorFavoritos(eventos.filter(e => e.destaque)),
    [eventos, estadosFiltroSalvos] // eslint-disable-line
  );

  const essaSemana = useMemo(() => {
    const lista = eventos.filter(e => {
      const d = new Date(e.data_evento + "T00:00:00");
      return d >= hoje && d <= em7dias && !e.destaque;
    });
    return filtrarPorFavoritos(lista);
  }, [eventos, estadosFiltroSalvos]); // eslint-disable-line

  const proximos30 = useMemo(() => {
    const lista = eventos.filter(e => {
      const d = new Date(e.data_evento + "T00:00:00");
      return d > em7dias && d <= em30dias;
    });
    return filtrarPorFavoritos(lista);
  }, [eventos, estadosFiltroSalvos]); // eslint-disable-line

  async function salvarEstadosFiltro(estados: string[]) {
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return;
    setSalvandoFiltro(true);

    // Deletar cidades antigas e inserir novas
    await authSupabase.from("user_cidades_interesse").delete().eq("user_id", user.id);

    if (estados.length > 0) {
      const rows = estados.map(uf => ({ user_id: user.id, cidade: uf, estado: uf }));
      await authSupabase.from("user_cidades_interesse").insert(rows);
    }

    setEstadosFiltroSalvos(estados);
    setSalvandoFiltro(false);
  }

  async function toggleEstadoFiltro(uf: string) {
    const novos = estadosFiltroSalvos.includes(uf)
      ? estadosFiltroSalvos.filter(e => e !== uf)
      : [...estadosFiltroSalvos, uf];
    setEstadosFiltroSalvos(novos);
    await salvarEstadosFiltro(novos);
  }

  async function toggleSalvarEvento(eventoId: number) {
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    setSalvandoEvento(eventoId);
    if (eventosSalvosIds.has(eventoId)) {
      await authSupabase.from("user_eventos_salvos").delete().eq("user_id", user.id).eq("evento_id", eventoId);
      setEventosSalvosIds(prev => { const next = new Set(prev); next.delete(eventoId); return next; });
    } else {
      await authSupabase.from("user_eventos_salvos").insert({ user_id: user.id, evento_id: eventoId });
      setEventosSalvosIds(prev => new Set([...prev, eventoId]));
    }
    setSalvandoEvento(null);
  }

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
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black flex gap-1.5" style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                <Flag size={12} strokeWidth={2.5} /> EVENTOS DE CORRIDA
              </div>
              <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
                PRÓXIMAS CORRIDAS<br /><span style={{ color: "#5CC800" }}>NO BRASIL</span>
              </h1>
              <p className="mt-3 text-sm" style={{ color: "#8B949E" }}>Encontre corridas, provas de rua e maratonas perto de você.</p>
              <a href="/sugerir-evento" className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
                style={{ background: "rgba(92,200,0,0.15)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                SUGERIR UM EVENTO
              </a>
            </div>
          </section>

          {/* Filtros */}
          <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Search size={14} color="#5CC800" strokeWidth={2} />
              <h2 className="font-black text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.05em" }}>FILTRAR EVENTOS</h2>
              {(busca || estadoSelecionado) && (
                <button onClick={limparFiltros} className="ml-auto rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  <X size={12} strokeWidth={2.5} /> LIMPAR
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
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEstadoSelecionado("")}
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-black transition-all"
                  style={{ background: estadoSelecionado === "" ? "#5CC800" : "rgba(92,200,0,0.08)", color: estadoSelecionado === "" ? "#0D1117" : "#8B949E", border: estadoSelecionado === "" ? "1px solid #5CC800" : "1px solid rgba(92,200,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  TODOS ({eventos.length})
                </button>
                {estadosDisponiveis.map(uf => {
                  const count = eventos.filter(e => e.estado === uf).length;
                  const ativo = estadoSelecionado === uf;
                  const favorito = estadosFiltroSalvos.includes(uf);
                  return (
                    <div key={uf} className="relative">
                      <button onClick={() => setEstadoSelecionado(uf === estadoSelecionado ? "" : uf)}
                        className="shrink-0 rounded-xl px-3 py-2 text-xs font-black transition-all"
                        style={{ background: ativo ? "#5CC800" : favorito ? "rgba(255,184,0,0.12)" : "rgba(92,200,0,0.08)", color: ativo ? "#0D1117" : favorito ? "#FFB800" : "#8B949E", border: ativo ? "1px solid #5CC800" : favorito ? "1px solid rgba(255,184,0,0.35)" : "1px solid rgba(92,200,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {uf} ({count})
                      </button>
                      {/* Estrela para salvar estado como favorito */}
                      {userEmail && (
                        <button onClick={() => toggleEstadoFiltro(uf)}
                          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full transition-all hover:scale-110"
                          title={favorito ? "Remover dos favoritos" : "Salvar estado como favorito"}
                          style={{ background: favorito ? "#FFB800" : "#21262D", border: "1px solid " + (favorito ? "#FFB800" : "rgba(255,255,255,0.15)") }}>
                          <Star size={8} strokeWidth={favorito ? 0 : 2} fill={favorito ? "#0D1117" : "none"} color={favorito ? "#0D1117" : "#8B949E"} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Banner: estados favoritos ativos */}
              {estadosFiltroSalvos.length > 0 && userEmail && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)" }}>
                  <Star size={12} color="#FFB800" strokeWidth={0} fill="#FFB800" />
                  <p className="text-xs font-bold flex-1" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Estados favoritos: <span style={{ color: "#E6EDF3" }}>{estadosFiltroSalvos.join(", ")}</span>
                    {" — "}destacados em amarelo
                  </p>
                  <button onClick={() => { setEstadoSelecionado(""); estadosFiltroSalvos.forEach(uf => toggleEstadoFiltro(uf)); }}
                    className="text-xs font-black"
                    style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    LIMPAR
                  </button>
                </div>
              )}

              {/* CTA para não logados */}
              {!userEmail && (
                <p className="text-xs" style={{ color: "#8B949E" }}>
                  <a href="/login" style={{ color: "#5CC800" }}>Entre</a> para salvar seus estados favoritos e vê-los destacados sempre que voltar.
                </p>
              )}
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
              <Flag size={40} color="rgba(92,200,0,0.3)" strokeWidth={1.5} style={{ margin: "0 auto 8px" }} />
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

          {/* ── DESTAQUES ───────────────────────────────────────── */}
          {!loading && destaques.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-1 rounded-full" style={{ background: "#FFB800" }} />
                <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>EM DESTAQUE</h2>
                <span className="rounded-full px-2 py-0.5 text-xs font-black" style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{destaques.length}</span>
                {temFavoritos && <span className="rounded-full px-2 py-0.5 text-xs font-black flex items-center gap-1" style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}><Star size={10} strokeWidth={0} fill="#FFB800" /> {estadosFiltroSalvos.join(", ")}</span>}
              </div>
              <CarrosselEventos eventos={destaques} isAdmin={isAdmin} eventosSalvosIds={eventosSalvosIds} onToggleSalvar={toggleSalvarEvento} salvandoEvento={salvandoEvento} />
            </div>
          )}

          {/* ── ESSA SEMANA ──────────────────────────────────────── */}
          {!loading && essaSemana.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
                <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>ESSA SEMANA</h2>
                <span className="rounded-full px-2 py-0.5 text-xs font-black" style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{essaSemana.length} eventos</span>
                {temFavoritos && <span className="rounded-full px-2 py-0.5 text-xs font-black flex items-center gap-1" style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}><Star size={10} strokeWidth={0} fill="#FFB800" /> {estadosFiltroSalvos.join(", ")}</span>}
              </div>
              <CarrosselEventos eventos={essaSemana} isAdmin={isAdmin} eventosSalvosIds={eventosSalvosIds} onToggleSalvar={toggleSalvarEvento} salvandoEvento={salvandoEvento} />
            </div>
          )}

          {/* ── PRÓXIMOS 30 DIAS ─────────────────────────────────── */}
          {!loading && proximos30.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-1 rounded-full" style={{ background: "#FF6B00" }} />
                <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>PRÓXIMOS 30 DIAS</h2>
                <span className="rounded-full px-2 py-0.5 text-xs font-black" style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{proximos30.length}</span>
                {temFavoritos && <span className="rounded-full px-2 py-0.5 text-xs font-black flex items-center gap-1" style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}><Star size={10} strokeWidth={0} fill="#FFB800" /> {estadosFiltroSalvos.join(", ")}</span>}
              </div>
              <CarrosselEventos eventos={proximos30} isAdmin={isAdmin} eventosSalvosIds={eventosSalvosIds} onToggleSalvar={toggleSalvarEvento} salvandoEvento={salvandoEvento} />
            </div>
          )}

          {/* Aviso quando filtro por favoritos não retorna resultados */}
          {!loading && temFavoritos && destaques.length === 0 && essaSemana.length === 0 && proximos30.length === 0 && (
            <div className="rounded-2xl p-5 text-center" style={{ background: "#161B22", border: "1px dashed rgba(255,184,0,0.25)" }}>
              <Star size={28} color="rgba(255,184,0,0.3)" strokeWidth={0} fill="rgba(255,184,0,0.3)" style={{ margin: "0 auto 8px" }} />
              <p className="font-black text-base" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                NENHUM EVENTO EM {estadosFiltroSalvos.join(", ")}
              </p>
              <p className="text-xs mt-1 mb-3" style={{ color: "#8B949E" }}>
                Não há eventos cadastrados nesse(s) estado(s) nos próximos 30 dias.
              </p>
              <button
                onClick={() => estadosFiltroSalvos.forEach(uf => toggleEstadoFiltro(uf))}
                className="rounded-xl px-4 py-2 text-xs font-black transition-all hover:brightness-110"
                style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                VER TODOS OS ESTADOS
              </button>
            </div>
          )}

          {/* Divisor */}
          {!loading && (destaques.length > 0 || essaSemana.length > 0 || proximos30.length > 0) && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-xs font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>TODOS OS EVENTOS POR ESTADO</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
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

              {/* Filtro por cidade dentro do estado */}
              {[...new Set(evs.map(e => e.cidade))].sort().length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCidadePorEstado(prev => ({ ...prev, [uf]: "" }))}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition-all"
                    style={{ background: !cidadePorEstado[uf] ? "#FF6B00" : "rgba(255,107,0,0.08)", color: !cidadePorEstado[uf] ? "#fff" : "#8B949E", border: !cidadePorEstado[uf] ? "1px solid #FF6B00" : "1px solid rgba(255,107,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    TODAS ({evs.length})
                  </button>
                  {[...new Set(evs.map(e => e.cidade))].sort().map(c => (
                    <button key={c} onClick={() => setCidadePorEstado(prev => ({ ...prev, [uf]: prev[uf] === c ? "" : c }))}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition-all"
                      style={{ background: cidadePorEstado[uf] === c ? "#FF6B00" : "rgba(255,107,0,0.08)", color: cidadePorEstado[uf] === c ? "#fff" : "#8B949E", border: cidadePorEstado[uf] === c ? "1px solid #FF6B00" : "1px solid rgba(255,107,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {c} ({evs.filter(e => e.cidade === c).length})
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-3">
              {(cidadePorEstado[uf] ? evs.filter(e => e.cidade === cidadePorEstado[uf]) : evs).map(evento => (
                  <article key={evento.id} className="relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#5CC800,#FF6B00)" }} />
                    {/* Botão salvar — posicionado absolutamente no canto */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSalvarEvento(evento.id); }}
                      disabled={salvandoEvento === evento.id}
                      className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110"
                      title={eventosSalvosIds.has(evento.id) ? "Remover dos salvos" : "Salvar evento"}
                      style={{ background: eventosSalvosIds.has(evento.id) ? "rgba(255,184,0,0.25)" : "rgba(255,255,255,0.07)", color: eventosSalvosIds.has(evento.id) ? "#FFB800" : "#8B949E", border: "1px solid " + (eventosSalvosIds.has(evento.id) ? "rgba(255,184,0,0.4)" : "rgba(255,255,255,0.08)") }}>
                      {salvandoEvento === evento.id
                        ? <span className="h-4 w-4 block animate-spin rounded-full border-2 border-yellow-400/30 border-t-yellow-400" />
                        : eventosSalvosIds.has(evento.id) ? <BookmarkCheck size={16} strokeWidth={2} /> : <Bookmark size={16} strokeWidth={2} />
                      }
                    </button>

                    <div className="p-4 pr-12">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{evento.nome}</h3>
                            {evento.destaque && <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>DESTAQUE</span>}
                          </div>
                          <p className="text-xs flex items-center gap-1" style={{ color: "#8B949E" }}><MapPin size={11} strokeWidth={2} />{evento.cidade} — {evento.estado}</p>
                        </div>
                        {evento.link_inscricao && (
                          <a href={evento.link_inscricao} target="_blank" rel="noreferrer"
                            className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition-all hover:brightness-110"
                            style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                            INSCREVER-SE <ArrowRight size={13} strokeWidth={2.5} />
                          </a>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1" style={{ background: "#21262D", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          <Calendar size={11} strokeWidth={2} />{formatarData(String(evento.data_evento))}
                        </span>
                        {evento.distancia && <span className="rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1" style={{ background: "#21262D", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}><Ruler size={11} strokeWidth={2} />{evento.distancia}</span>}
                        {evento.local && <span className="rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1" style={{ background: "#21262D", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}><MapPin size={11} strokeWidth={2} />{evento.local}</span>}
                      </div>
                    </div>
                  </article>
              ))}
              </div>
            </section>
          ))}

          {/* CTA loja melhorado */}
          {!loading && totalFiltrado > 0 && (
            <a href="/loja" className="block rounded-2xl overflow-hidden transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #1a0a00, #2a1200)", border: "1px solid rgba(255,107,0,0.3)" }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#FF6B00,#FFB800)" }} />
              <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#FF6B00", letterSpacing: "0.02em" }}>
                    🏅 SE PREPARANDO PARA UMA PROVA?
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#8B949E" }}>
                    Conjuntos, tênis, acessórios e nutrição selecionados para corredores.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Tênis","Conjuntos","Nutrição","Bonés"].map(item => (
                      <span key={item} className="rounded-lg px-2 py-1 text-xs font-bold"
                        style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black self-start sm:self-center"
                  style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  <ShoppingBag size={16} strokeWidth={2} /> VER LOJA
                </div>
              </div>
            </a>
          )}

        </div>
      </main>
    </>
  );
}
