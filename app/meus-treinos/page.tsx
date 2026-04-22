"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Encontro = {
  id: number; titulo: string; cidade: string; estado: string;
  tipo_treino?: string; horario?: string; km_planejado?: number;
  distancia?: string; local_saida?: string; user_id?: string | null;
  data_encontro: string;
  encontro_participantes?: { id: number }[];
};

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

function BotaoExcluir({ encontroId, titulo }: { encontroId: number; titulo: string }): React.JSX.Element {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function excluir() {
    setLoading(true); setErro("");
    try {
      const res = await fetch("/api/deletar-encontro", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encontroId }),
      });
      const result = await res.json();
      if (!res.ok) { setErro(result.error || "Erro ao excluir."); setLoading(false); return; }
      router.refresh();
    } catch { setErro("Erro de conexão."); setLoading(false); }
  }

  if (confirmando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && setConfirmando(false)}>
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">🗑️</div>
          <h3 className="mt-3 text-lg font-bold text-slate-900">Excluir treino?</h3>
          <p className="mt-1 text-sm text-slate-500">O treino <span className="font-semibold">&quot;{titulo}&quot;</span> será removido permanentemente.</p>
          {erro && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}
          <div className="mt-5 flex gap-3">
            <button onClick={() => { setConfirmando(false); setErro(""); }} disabled={loading}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={excluir} disabled={loading}
              className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">
              {loading ? "Excluindo..." : "Sim, excluir"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirmando(true)}
      className="flex items-center gap-1.5 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
      🗑️ Excluir
    </button>
  );
}

export default function MeusTreinosPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [encontros, setEncontros] = useState<Encontro[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email || "");
      setUserId(user.id);

      const { data: adminRow } = await supabase.from("admins").select("email")
        .eq("email", user.email?.toLowerCase() ?? "").single();
      const admin = !!adminRow;
      setIsAdmin(admin);

      const query = supabase.from("encontros")
        .select("*, encontro_participantes(id)")
        .order("data_encontro", { ascending: true });

      const { data, error: err } = admin
        ? await query
        : await query.eq("user_id", user.id);

      if (err) setError(err.message);
      else setEncontros(data || []);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <>
        <Header userEmail={userEmail} isAdmin={isAdmin} />
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">

          <section className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-800 p-7 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-200">
                  {isAdmin ? "👑 Painel Admin" : "Sua conta"}
                </span>
                <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{isAdmin ? "Todos os treinos" : "Meus treinos"}</h1>
                <p className="mt-1 text-sm text-slate-400">
                  {isAdmin
                    ? `Visão de administrador · ${encontros.length} treino${encontros.length !== 1 ? "s" : ""} no total`
                    : `Treinos que você organizou · ${encontros.length} no total`}
                </p>
              </div>
              {isAdmin && <span className="shrink-0 rounded-2xl bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-300">Acesso total</span>}
            </div>
          </section>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">Erro: {error}</div>}

          {!error && encontros.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mb-3 text-4xl">🏃</div>
              <p className="font-semibold text-slate-700">Nenhum treino encontrado</p>
              <p className="mt-1 text-sm text-slate-500">{isAdmin ? "Nenhum treino foi criado ainda." : "Organize seu primeiro treino e convide amigos para correr."}</p>
              <Link href="/encontros" className="mt-5 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Criar treino</Link>
            </div>
          )}

          <div className="space-y-4">
            {encontros.map(e => {
              const participantes = e.encontro_participantes?.length || 0;
              const ehDono = e.user_id === userId;
              return (
                <div key={e.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{e.titulo}</h2>
                        {e.tipo_treino && <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">{e.tipo_treino}</span>}
                        {isAdmin && !ehDono && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">de outro usuário</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">📍 {e.cidade} - {e.estado}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/treinos/${e.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-500 hover:text-white hover:border-orange-500">Abrir →</Link>
                      <BotaoExcluir encontroId={e.id} titulo={e.titulo} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Data", formatarData(String(e.data_encontro))],
                      ["Horário", String(e.horario || "—")],
                      ["KM", e.km_planejado ? `${e.km_planejado} km` : (e.distancia || "—")],
                      ["Participantes", String(participantes)],
                    ].map(([l, v], i) => (
                      <div key={l} className={`rounded-2xl p-3 ${i === 3 && participantes > 0 ? "bg-orange-50" : "bg-slate-50"}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                        <p className={`mt-0.5 text-sm font-bold ${i === 3 && participantes > 0 ? "text-orange-600" : "text-slate-800"}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {e.local_saida && <p className="mt-3 text-xs text-slate-500">🏁 Ponto de saída: <span className="font-medium text-slate-700">{e.local_saida}</span></p>}
                </div>
              );
            })}
          </div>

          {!error && encontros.length > 0 && (
            <div className="text-center">
              <Link href="/encontros" className="inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">+ Criar novo treino</Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
