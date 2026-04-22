"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/client";

type Evento = {
  id: number; nome: string; cidade: string; estado: string;
  data_evento: string; distancia?: string; local?: string;
  link_inscricao?: string; destaque?: boolean;
};

const estados = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function formatarData(data: string) {
  if (!data) return "—";
  try { const [,mes,dia] = String(data).split("-"); return `${dia}/${mes}`; }
  catch { return String(data); }
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
  const [cidade, setCidade] = useState(searchParams.get("cidade") || "");
  const [estado, setEstado] = useState(searchParams.get("estado") || "");

  const cidadeFiltro = searchParams.get("cidade") || "";
  const estadoFiltro = searchParams.get("estado") || "";
  const temFiltro = !!(cidadeFiltro || estadoFiltro);

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

  function aplicarFiltro(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (cidade.trim()) params.set("cidade", cidade.trim());
    if (estado) params.set("estado", estado);
    const qs = params.toString();
    router.push(qs ? `/eventos?${qs}` : "/eventos");
  }

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">

          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 to-slate-800 p-8 text-white shadow-2xl sm:p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10" />
            <div className="relative max-w-2xl">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-orange-300">Eventos de Corrida</span>
              <h1 className="mt-4 text-3xl font-bold sm:text-5xl leading-tight">Próximas corridas<br /><span className="text-orange-400">no Brasil</span></h1>
              <p className="mt-4 text-sm text-slate-400 sm:text-base">Encontre corridas, provas de rua e maratonas perto de você.</p>
            </div>
          </section>

          {/* Filtro */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="text-base font-bold text-slate-900">Filtrar eventos</h2>
              {temFiltro && <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">Filtro ativo</span>}
            </div>
            <form onSubmit={aplicarFiltro} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="text" placeholder="Cidade (ex: São Paulo)" value={cidade} onChange={e => setCidade(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100" />
              <select value={estado} onChange={e => setEstado(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none sm:w-40">
                <option value="">Estado</option>
                {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              <div className="flex shrink-0 gap-2">
                <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700">Buscar</button>
                {temFiltro && (
                  <button type="button" onClick={() => { setCidade(""); setEstado(""); router.push("/eventos"); }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Limpar</button>
                )}
              </div>
            </form>
          </div>

          {/* Lista */}
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Eventos disponíveis</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {loading ? "Carregando..." : error ? "Erro ao carregar" : temFiltro
                    ? `${eventos.length} resultado${eventos.length !== 1 ? "s" : ""} para o filtro`
                    : `${eventos.length} evento${eventos.length !== 1 ? "s" : ""} encontrado${eventos.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              {temFiltro && <button onClick={() => { setCidade(""); setEstado(""); router.push("/eventos"); }} className="text-xs font-semibold text-orange-600 hover:underline">Limpar filtros</button>}
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">Erro: {error}</div>}

            {loading && (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
              </div>
            )}

            {!loading && !error && eventos.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="text-4xl mb-2">🏁</div>
                <p className="font-semibold text-slate-700">{temFiltro ? "Nenhum evento para esse filtro" : "Nenhum evento cadastrado ainda"}</p>
                {temFiltro && <button onClick={() => router.push("/eventos")} className="mt-4 inline-flex rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Ver todos</button>}
              </div>
            )}

            {!loading && (
              <div className="space-y-4">
                {eventos.map(evento => (
                  <article key={evento.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{evento.nome}</h3>
                          {evento.destaque && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">⭐ Destaque</span>}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">📍 {evento.cidade} — {evento.estado}</p>
                      </div>
                      {evento.link_inscricao && (
                        <a href={evento.link_inscricao} target="_blank" rel="noreferrer"
                          className="shrink-0 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
                          Inscrever-se →
                        </a>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[["Data", formatarData(String(evento.data_evento))], ["Distância", evento.distancia || "—"], ["Local", evento.local || "—"], ["Tipo", evento.destaque ? "Destaque" : "Evento"]].map(([l, v]) => (
                        <div key={l} className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800">{v}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-900">Se preparando para uma prova? 🏅</p>
                <p className="mt-0.5 text-sm text-slate-500">Veja os kits recomendados pela Moda Run.</p>
              </div>
              <a href="/loja" className="shrink-0 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Ver loja</a>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
