"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import CompartilharTreino from "@/components/CompartilharTreino";
import ParticiparEncontro from "@/components/ParticiparEncontro";
import MapaTreinoVisualizacao from "@/components/MapaTreinoVisualizacao";
import { createClient } from "@/utils/supabase/client";

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

type Participante = { id: number; nome: string };
type Treino = { id: number; titulo: string; cidade: string; estado: string; tipo_treino?: string; data_encontro: string; horario?: string; distancia?: string; km_planejado?: number; organizador_nome?: string; local_saida?: string; ponto_encontro_lat?: number; ponto_encontro_lng?: number; rota_coords?: { lat: number; lng: number }[]; ritmo?: string; percurso?: string; observacoes?: string; user_id?: string | null; encontro_participantes?: Participante[] };

export default function TreinoPage() {
  const params = useParams();
  const id = params?.id as string;
  const [treino, setTreino] = useState<Treino | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [podeExcluir, setPodeExcluir] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email; const uid = user?.id;
      setUserEmail(email); setUserId(uid);
      const { data, error } = await supabase.from("encontros").select("*, encontro_participantes(id, nome)").eq("id", id).single();
      if (error || !data) { setLoading(false); return; }
      setTreino(data);
      let usuarioEAdmin = false;
      if (email) {
        const { data: adminRow } = await supabase.from("admins").select("email").eq("email", email.toLowerCase()).single();
        usuarioEAdmin = !!adminRow;
      }
      setIsAdmin(usuarioEAdmin);
      const usuarioEDono = !!uid && (data.user_id === uid || data.user_id === null);
      setPodeExcluir(usuarioEDono || usuarioEAdmin);
      setLoading(false);
    }
    carregar();
  }, [id]);

  const router = useRouter();
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState("");

  async function excluir() {
    setExcluindo(true); setErroExcluir("");
    try {
      const res = await fetch("/api/deletar-encontro", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ encontroId: treino?.id }) });
      const result = await res.json();
      if (!res.ok) { setErroExcluir(result.error || "Erro ao excluir."); setExcluindo(false); return; }
      router.push("/encontros");
    } catch { setErroExcluir("Erro de conexão."); setExcluindo(false); }
  }

  if (loading) {
    return (
      <>
        <Header userEmail={userEmail} isAdmin={isAdmin} />
        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            <p className="text-sm text-slate-500">Carregando treino...</p>
          </div>
        </main>
      </>
    );
  }

  if (!treino) {
    return (
      <>
        <Header userEmail={userEmail} isAdmin={isAdmin} />
        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">🏃</p><p className="mt-3 font-semibold text-slate-700">Treino não encontrado</p>
          </div>
        </main>
      </>
    );
  }

  const participantes = treino.encontro_participantes || [];
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://modarun.vercel.app"}/treinos/${id}/publico`;

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <section className="relative overflow-hidden rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #1a3a0a, #0f2106)", border: "1px solid rgba(92,200,0,0.3)" }}>
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {treino.tipo_treino && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,107,0,0.2)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{treino.tipo_treino}</span>}
                <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(92,200,0,0.2)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>👥 {participantes.length} participante{participantes.length !== 1 ? "s" : ""}</span>
                {isAdmin && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,184,0,0.2)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>👑 Admin</span>}
              </div>
              <h1 className="text-3xl font-black sm:text-4xl leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{treino.titulo}</h1>
              <p className="mt-1 text-sm" style={{ color: "rgba(92,200,0,0.8)" }}>📍 {treino.cidade} — {treino.estado}</p>
            </div>
          </section>

          <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
            <p className="text-xs font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>🔗 COMPARTILHAR TREINO</p>
            <CompartilharTreino url={url} />
          </div>

          {podeExcluir && (
            <div className="flex items-center justify-between rounded-2xl px-5 py-3" style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)" }}>
              <div>
                <p className="text-sm font-black" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{isAdmin && treino.user_id !== userId ? "👑 Você é administrador" : "✏️ Você criou este treino"}</p>
                <p className="text-xs" style={{ color: "#8B949E" }}>Somente você pode excluí-lo.</p>
              </div>
              <button onClick={() => setConfirmandoExcluir(true)} className="flex items-center gap-1.5 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">🗑️ Excluir treino</button>
            </div>
          )}

          {confirmandoExcluir && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setConfirmandoExcluir(false)}>
              <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">🗑️</div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">Excluir treino?</h3>
                <p className="mt-1 text-sm text-slate-500">O treino <span className="font-semibold">"{treino.titulo}"</span> e todos os participantes serão removidos permanentemente.</p>
                {erroExcluir && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erroExcluir}</div>}
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setConfirmandoExcluir(false)} disabled={excluindo} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
                  <button onClick={excluir} disabled={excluindo} className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">{excluindo ? "Excluindo..." : "Sim, excluir"}</button>
                </div>
              </div>
            </div>
          )}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["📅","Data",formatarData(String(treino.data_encontro))],["⏰","Horário",String(treino.horario||"—")],["📏","Distância",treino.distancia||(treino.km_planejado?`${treino.km_planejado} km`:"—")],["👤","Organizador",treino.organizador_nome||"—"]].map(([icon,label,value])=>(
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg">{icon}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-0.5 text-sm font-bold text-slate-800 leading-tight">{value}</p>
              </div>
            ))}
          </section>

          {treino.local_saida && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-base font-bold text-slate-900">📍 Ponto de encontro</h2>
              <p className="text-sm font-semibold text-slate-700">{treino.local_saida}</p>
              {treino.ponto_encontro_lat && treino.ponto_encontro_lng && <p className="mt-1 text-xs text-slate-400">{Number(treino.ponto_encontro_lat).toFixed(5)}, {Number(treino.ponto_encontro_lng).toFixed(5)}</p>}
            </section>
          )}

          {treino.ponto_encontro_lat && treino.ponto_encontro_lng && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-900">🗺 Percurso</h2>
              <MapaTreinoVisualizacao pontoEncontro={{ lat: treino.ponto_encontro_lat, lng: treino.ponto_encontro_lng }} rotaCoords={treino.rota_coords || []} />
            </section>
          )}

          {(treino.ritmo || treino.percurso || treino.observacoes) && (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Detalhes do treino</h2>
              {treino.ritmo && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ritmo</p><p className="mt-0.5 text-sm text-slate-700">{treino.ritmo}</p></div>}
              {treino.percurso && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Percurso</p><p className="mt-0.5 text-sm text-slate-700">{treino.percurso}</p></div>}
              {treino.observacoes && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observações</p><p className="mt-0.5 text-sm text-slate-700">{treino.observacoes}</p></div>}
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Participantes <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">{participantes.length}</span></h2>
              <ParticiparEncontro encontroId={treino.id} />
            </div>
            {participantes.length === 0 ? <p className="text-sm text-slate-500">Seja o primeiro a confirmar presença!</p> : (
              <div className="flex flex-wrap gap-2">
                {participantes.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">{p.nome[0].toUpperCase()}</span>
                    {p.nome}
                  </span>
                ))}
              </div>
            )}
            
          </section>

          <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-lg">
            <p className="text-sm font-semibold text-orange-300">Moda Run Store</p>
            <p className="mt-1 text-lg font-bold">Equipado para esse treino? 🏃‍♂️</p>
            <p className="mt-1 text-sm text-slate-400">Veja kits e acessórios ideais para sua corrida.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="https://wa.me/5594920009526?text=Olá! Vou participar de um treino pelo app Moda Run e quero ver produtos." target="_blank" rel="noreferrer" className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">💬 WhatsApp</a>
              <a href="/loja" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">Ver loja</a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
