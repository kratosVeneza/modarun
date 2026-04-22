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
  data_encontro: string; encontro_participantes?: { id: number }[];
};

function formatarData(data: string) {
  if (!data) return "—";
  const [, mes, dia] = String(data).split("-");
  return `${dia}/${mes}`;
}

function BotaoExcluir({ encontroId, titulo }: { encontroId: number; titulo: string }): React.JSX.Element {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function excluir() {
    setLoading(true); setErro("");
    try {
      const res = await fetch("/api/deletar-encontro", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ encontroId }) });
      const result = await res.json();
      if (!res.ok) { setErro(result.error || "Erro ao excluir."); setLoading(false); return; }
      router.refresh();
    } catch { setErro("Erro de conexão."); setLoading(false); }
  }

  if (confirmando) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && setConfirmando(false)}>
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.3)" }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-3" style={{ background: "rgba(255,107,0,0.15)" }}>🗑️</div>
        <h3 className="font-black text-lg mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>EXCLUIR TREINO?</h3>
        <p className="text-sm mb-4" style={{ color: "#8B949E" }}>O treino <span className="font-bold" style={{ color: "#E6EDF3" }}>"{titulo}"</span> será removido permanentemente.</p>
        {erro && <div className="rounded-xl p-3 text-sm mb-3" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>{erro}</div>}
        <div className="flex gap-3">
          <button onClick={() => { setConfirmando(false); setErro(""); }} disabled={loading}
            className="flex-1 rounded-xl py-3 text-sm font-black"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
            CANCELAR
          </button>
          <button onClick={excluir} disabled={loading}
            className="flex-1 rounded-xl py-3 text-sm font-black"
            style={{ background: "rgba(255,107,0,0.2)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {loading ? "EXCLUINDO..." : "SIM, EXCLUIR"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <button onClick={() => setConfirmando(true)} className="rounded-xl px-3 py-2 text-xs font-black"
      style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
      🗑️ EXCLUIR
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
      setUserEmail(user.email || ""); setUserId(user.id);
      const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
      const admin = !!adminRow; setIsAdmin(admin);
      const query = supabase.from("encontros").select("*, encontro_participantes(id)").order("data_encontro", { ascending: true });
      const { data, error: err } = admin ? await query : await query.eq("user_id", user.id);
      if (err) setError(err.message);
      else setEncontros(data || []);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
      </main>
    </>
  );

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-10" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-4xl flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black"
                style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                {isAdmin ? "⚙️ PAINEL ADMIN" : "📋 MINHA CONTA"}
              </div>
              <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
                {isAdmin ? "TODOS OS TREINOS" : "MEUS TREINOS"}
              </h1>
              <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>
                {isAdmin ? `Visão de admin · ${encontros.length} treino${encontros.length !== 1 ? "s" : ""} no total` : `${encontros.length} treino${encontros.length !== 1 ? "s" : ""} organizados`}
              </p>
            </div>
            {isAdmin && <span className="rounded-xl px-3 py-2 text-xs font-black shrink-0" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>ACESSO TOTAL</span>}
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
          {error && <div className="rounded-xl p-4 text-sm font-semibold" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)" }}>Erro: {error}</div>}

          {!error && encontros.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.2)" }}>
              <p className="text-4xl mb-2">🏃</p>
              <p className="font-black text-xl mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>NENHUM TREINO ENCONTRADO</p>
              <p className="text-sm mb-5" style={{ color: "#8B949E" }}>{isAdmin ? "Nenhum treino foi criado ainda." : "Organize seu primeiro treino."}</p>
              <Link href="/encontros" className="inline-flex rounded-xl px-5 py-3 text-sm font-black"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                ⚡ CRIAR TREINO
              </Link>
            </div>
          )}

          {encontros.map(e => {
            const participantes = e.encontro_participantes?.length || 0;
            const ehDono = e.user_id === userId;
            return (
              <div key={e.id} className="relative overflow-hidden rounded-2xl p-5 transition-all"
                style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{e.titulo}</h2>
                      {e.tipo_treino && <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{e.tipo_treino}</span>}
                      {isAdmin && !ehDono && <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>outro usuário</span>}
                    </div>
                    <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>📍 {e.cidade} - {e.estado}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={`/treinos/${e.id}`} className="rounded-xl px-4 py-2 text-xs font-black transition-all hover:brightness-110"
                      style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ABRIR →
                    </Link>
                    <BotaoExcluir encontroId={e.id} titulo={e.titulo} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["📅", "DATA", formatarData(String(e.data_encontro))],
                    ["⏰", "HORÁRIO", String(e.horario || "—")],
                    ["📏", "KM", e.km_planejado ? `${e.km_planejado}km` : (e.distancia || "—")],
                    ["👥", "PARTICIPANTES", String(participantes)],
                  ].map(([icon, label, value], i) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: i === 3 && participantes > 0 ? "rgba(92,200,0,0.08)" : "#21262D" }}>
                      <p className="text-xs font-black mb-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{icon} {label}</p>
                      <p className="font-black text-sm" style={{ color: i === 3 && participantes > 0 ? "#5CC800" : "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
                    </div>
                  ))}
                </div>
                {e.local_saida && <p className="mt-3 text-xs" style={{ color: "#8B949E" }}>🏁 Saída: <span style={{ color: "#E6EDF3", fontWeight: 600 }}>{e.local_saida}</span></p>}
              </div>
            );
          })}

          {!error && encontros.length > 0 && (
            <div className="text-center pt-2">
              <Link href="/encontros" className="inline-flex rounded-xl px-6 py-3 text-sm font-black transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                ⚡ CRIAR NOVO TREINO
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
