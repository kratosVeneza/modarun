"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";

const MapaTreinoVisualizacao = dynamic(() => import("@/components/MapaTreinoVisualizacao"), { ssr: false });

type Participante = { id: number; nome: string; whatsapp?: string };
type Treino = {
  id: number; titulo: string; cidade: string; estado: string;
  tipo_treino?: string; data_encontro: string; horario?: string;
  distancia?: string; km_planejado?: number; organizador_nome?: string;
  local_saida?: string; ritmo?: string; percurso?: string; observacoes?: string;
  ponto_encontro_lat?: number; ponto_encontro_lng?: number;
  rota_coords?: { lat: number; lng: number }[];
  encontro_participantes?: Participante[];
  user_id?: string;
};

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

const inp = { background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", outline: "none", width: "100%" } as React.CSSProperties;

export default function TreinoPublicoPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [treino, setTreino] = useState<Treino | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Confirmar presença
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Cancelar participação própria
  const [cancelarModal, setCancelarModal] = useState(false);
  const [cancelarId, setCancelarId] = useState<number | null>(null);
  const [cancelarNome, setCancelarNome] = useState("");
  const [cancelarNomeInput, setCancelarNomeInput] = useState("");
  const [cancelarWhatsappInput, setCancelarWhatsappInput] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [cancelarErro, setCancelarErro] = useState("");

  // Remover participante (admin do treino)
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data, error } = await supabase
        .from("encontros")
        .select("*, encontro_participantes(id, nome, whatsapp)")
        .eq("id", id)
        .single();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setTreino(data as Treino);
      setLoading(false);
    }
    carregar();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const participantes = treino?.encontro_participantes || [];
  const isCriador = !!userId && treino?.user_id === userId;

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setMensagem("Informe seu nome."); return; }
    setEnviando(true); setMensagem("");
    const res = await fetch("/api/participar-encontro", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encontro_id: Number(id), nome: nome.trim(), whatsapp }),
    });
    const result = await res.json();
    setEnviando(false);
    if (!res.ok) { setMensagem(result.error || "Erro ao confirmar."); return; }
    setSucesso(true);
    setTreino(t => t ? { ...t, encontro_participantes: [...(t.encontro_participantes || []), result.data?.[0]] } : t);
    setTimeout(() => { setModalAberto(false); setSucesso(false); setNome(""); setWhatsapp(""); }, 2000);
  }

  async function cancelarParticipacao() {
    const p = participantes.find(x => x.id === cancelarId);
    const temWhatsapp = !!p?.whatsapp;
    if (temWhatsapp && !cancelarWhatsappInput.trim()) { setCancelarErro("Informe seu WhatsApp."); return; }
    if (!temWhatsapp && !cancelarNomeInput.trim()) { setCancelarErro("Informe seu nome."); return; }
    setCancelando(true); setCancelarErro("");
    const res = await fetch("/api/cancelar-participacao", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participante_id: cancelarId, nome: cancelarNomeInput.trim(), whatsapp: cancelarWhatsappInput.trim() }),
    });
    const result = await res.json();
    setCancelando(false);
    if (!res.ok) { setCancelarErro(result.error || "Erro ao cancelar."); return; }
    setTreino(t => t ? { ...t, encontro_participantes: (t.encontro_participantes || []).filter(x => x.id !== cancelarId) } : t);
    setCancelarModal(false); setCancelarNomeInput(""); setCancelarWhatsappInput(""); setCancelarId(null);
  }

  async function removerParticipante(participanteId: number) {
    if (!confirm("Remover este participante?")) return;
    setRemovendoId(participanteId);
    const { error } = await supabase.from("encontro_participantes").delete().eq("id", participanteId);
    setRemovendoId(null);
    if (!error) setTreino(t => t ? { ...t, encontro_participantes: (t.encontro_participantes || []).filter(x => x.id !== participanteId) } : t);
  }

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center" style={{ background: "#0D1117" }}>
      <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
    </main>
  );

  if (notFound || !treino) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4" style={{ background: "#0D1117" }}>
      <p className="text-5xl">😕</p>
      <p className="font-black text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>TREINO NÃO ENCONTRADO</p>
      <Link href="/" className="rounded-xl px-5 py-3 text-sm font-black" style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>IR PARA O INÍCIO</Link>
    </main>
  );

  const temMapa = treino.ponto_encontro_lat && treino.ponto_encontro_lng;

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "#0D1117" }}>

      {/* Modal cancelar participação própria */}
      {cancelarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.3)" }}>
            <h3 className="font-black text-lg mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>CANCELAR PARTICIPAÇÃO</h3>
            {(() => {
              const p = participantes.find(x => x.id === cancelarId);
              return p?.whatsapp ? (
                <>
                  <p className="text-sm mb-4" style={{ color: "#8B949E" }}>Informe o <strong style={{ color: "#E6EDF3" }}>WhatsApp</strong> cadastrado para confirmar o cancelamento de <strong style={{ color: "#E6EDF3" }}>"{cancelarNome}"</strong>.</p>
                  <input type="tel" placeholder="(00) 00000-0000" value={cancelarWhatsappInput} onChange={e => setCancelarWhatsappInput(e.target.value)} style={inp}
                    onFocus={e => (e.target.style.borderColor = "#FF6B00")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
                </>
              ) : (
                <>
                  <p className="text-sm mb-4" style={{ color: "#8B949E" }}>Digite seu nome <strong style={{ color: "#E6EDF3" }}>"{cancelarNome}"</strong> para confirmar.</p>
                  <input type="text" placeholder="Seu nome" value={cancelarNomeInput} onChange={e => setCancelarNomeInput(e.target.value)} style={inp}
                    onFocus={e => (e.target.style.borderColor = "#FF6B00")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
                </>
              );
            })()}
            {cancelarErro && <p className="mt-2 text-sm" style={{ color: "#FF6B00" }}>{cancelarErro}</p>}
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => { setCancelarModal(false); setCancelarNomeInput(""); setCancelarWhatsappInput(""); setCancelarErro(""); }}
                className="flex-1 rounded-xl py-3 text-sm font-black"
                style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                VOLTAR
              </button>
              <button type="button" onClick={cancelarParticipacao} disabled={cancelando}
                className="flex-1 rounded-xl py-3 text-sm font-black disabled:opacity-60"
                style={{ background: "rgba(255,107,0,0.2)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {cancelando ? "CANCELANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar presença */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>CONFIRMAR PRESENÇA</h3>
              <button onClick={() => setModalAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>✕</button>
            </div>
            {sucesso ? (
              <div className="text-center py-4">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800" }}>PRESENÇA CONFIRMADA!</p>
                <p className="text-sm mt-1" style={{ color: "#8B949E" }}>Você está na lista. Até lá! 🏃</p>
              </div>
            ) : (
              <form onSubmit={confirmar} className="space-y-3">
                <div>
                  <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>SEU NOME *</label>
                  <input type="text" placeholder="Como você quer ser chamado" value={nome} onChange={e => setNome(e.target.value)} autoFocus style={inp}
                    onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>WHATSAPP <span style={{ fontWeight:400 }}>(opcional — mas ajuda a identificar você)</span></label>
                  <input type="tel" placeholder="(00) 00000-0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={inp}
                    onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
                </div>
                {mensagem && <p className="text-sm" style={{ color: "#FF6B00" }}>{mensagem}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModalAberto(false)} className="flex-1 rounded-xl py-3 text-sm font-black" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>CANCELAR</button>
                  <button type="submit" disabled={enviando} className="flex-1 rounded-xl py-3 text-sm font-black disabled:opacity-60 hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {enviando ? "CONFIRMANDO..." : "✅ CONFIRMAR"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-xl space-y-4">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <img src="/logo-moda-run.png" alt="Moda Run" style={{ height: "40px", width: "auto" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </Link>
          <Link href="/encontros" className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>VER TREINOS →</Link>
        </div>

        {/* Badge criador */}
        {isCriador && (
          <div className="rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.3)" }}>
            <span>⚙️</span>
            <p className="text-xs font-black" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              VOCÊ CRIOU ESTE TREINO — pode remover participantes pela lista abaixo
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #1a3a0a, #0f2106)", border: "1px solid rgba(92,200,0,0.3)" }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative">
            <div className="flex flex-wrap gap-2 mb-3">
              {treino.tipo_treino && <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,107,0,0.2)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{treino.tipo_treino}</span>}
              <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: "rgba(92,200,0,0.2)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                👥 {participantes.length} confirmado{participantes.length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1 className="text-3xl font-black leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{treino.titulo}</h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(92,200,0,0.8)" }}>📍 {treino.cidade} — {treino.estado}</p>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ["📅", "DATA", formatarData(treino.data_encontro)],
            ["⏰", "HORÁRIO", treino.horario || "—"],
            ["📏", "DISTÂNCIA", treino.km_planejado ? `${treino.km_planejado}km` : treino.distancia || "—"],
            ["🏃", "ORGANIZADOR", treino.organizador_nome || "—"],
          ].map(([icon, label, value]) => (
            <div key={String(label)} className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
              <p className="text-xs font-black mb-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{icon} {label}</p>
              <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>

        {treino.local_saida && (
          <div className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
            <p className="text-xs font-black mb-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>🏁 PONTO DE ENCONTRO</p>
            <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{treino.local_saida}</p>
          </div>
        )}

        {(treino.ritmo || treino.percurso || treino.observacoes) && (
          <div className="rounded-xl p-4 space-y-1.5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
            {treino.ritmo && <p className="text-sm" style={{ color: "#8B949E" }}>🎯 <strong style={{ color: "#E6EDF3" }}>Ritmo:</strong> {treino.ritmo}</p>}
            {treino.percurso && <p className="text-sm" style={{ color: "#8B949E" }}>🗺 <strong style={{ color: "#E6EDF3" }}>Percurso:</strong> {treino.percurso}</p>}
            {treino.observacoes && <p className="text-sm" style={{ color: "#8B949E" }}>📝 <strong style={{ color: "#E6EDF3" }}>Obs:</strong> {treino.observacoes}</p>}
          </div>
        )}

        {temMapa && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(92,200,0,0.2)" }}>
            <MapaTreinoVisualizacao
              pontoEncontro={{ lat: treino.ponto_encontro_lat!, lng: treino.ponto_encontro_lng! }}
              rotaCoords={treino.rota_coords || []} />
          </div>
        )}

        {/* Botão confirmar */}
        <button type="button" onClick={() => setModalAberto(true)}
          className="w-full rounded-xl py-4 text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(92,200,0,0.3)" }}>
          ⚡ CONFIRMAR PRESENÇA
        </button>

        {/* Lista de participantes */}
        <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
            <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>PARTICIPANTES</h2>
            <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{participantes.length}</span>
          </div>

          {participantes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-1">🏃</p>
              <p className="text-sm" style={{ color: "#8B949E" }}>Seja o primeiro a confirmar presença!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {participantes.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.08)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black"
                      style={{ background: i === 0 ? "rgba(255,184,0,0.2)" : "rgba(92,200,0,0.15)", color: i === 0 ? "#FFB800" : "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {i === 0 ? "👑" : i + 1}
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{p.nome}</p>
                      {i === 0 && <p className="text-xs" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>organizador</p>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Botão cancelar própria participação — para todos */}
                    <button type="button"
                      onClick={() => { setCancelarId(p.id); setCancelarNome(p.nome); setCancelarModal(true); setCancelarNomeInput(""); setCancelarWhatsappInput(""); setCancelarErro(""); }}
                      className="rounded-lg px-3 py-1.5 text-xs font-black transition-all hover:brightness-110"
                      style={{ background: "rgba(92,200,0,0.08)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      É VOCÊ?
                    </button>

                    {/* Botão remover — só para o criador do treino */}
                    {isCriador && (
                      <button type="button" onClick={() => removerParticipante(p.id)} disabled={removendoId === p.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-black disabled:opacity-50 transition-all hover:brightness-110"
                        style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {removendoId === p.id ? "..." : "🗑️"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-center" style={{ color: "#8B949E" }}>
            Clique em <strong style={{ color: "#5CC800" }}>É VOCÊ?</strong> ao lado do seu nome para cancelar sua participação
          </p>
        </div>
      </div>
    </main>
  );
}
