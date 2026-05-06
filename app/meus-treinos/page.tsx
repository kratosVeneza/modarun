"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const MapaTreinoEditor = dynamic(() => import("@/components/MapaTreinoEditor"), { ssr: false });
type LatLng = { lat: number; lng: number };

type Encontro = {
  id: number; titulo: string; cidade: string; estado: string;
  tipo_treino?: string; horario?: string; km_planejado?: number;
  distancia?: string; local_saida?: string; user_id?: string | null;
  data_encontro: string; percurso?: string | null; ritmo?: string | null; observacoes?: string | null; organizador_nome?: string | null;
  ponto_encontro_lat?: number | null; ponto_encontro_lng?: number | null; rota_coords?: LatLng[] | null;
  encontro_participantes?: { id: number }[];
};

function formatarData(data: string) {
  if (!data) return "—";
  const [, mes, dia] = String(data).split("-");
  return `${dia}/${mes}`;
}

function hojeLocalISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function treinoExpirado(data: string): boolean {
  return String(data || "") < hojeLocalISO();
}

const campoStyle = { background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3", borderRadius: "12px", padding: "10px 12px", fontSize: "13px", outline: "none", width: "100%" } as React.CSSProperties;
const labelStyle = { display: "block", fontSize: "11px", fontWeight: 800, color: "#8B949E", marginBottom: "5px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" } as React.CSSProperties;

function BotaoExcluir({ encontroId, titulo, onDeleted }: { encontroId: number; titulo: string; onDeleted?: (id: number) => void }): React.JSX.Element {
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
      setConfirmando(false);
      setLoading(false);
      onDeleted?.(encontroId);
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

function BotaoEditarTreino({ encontro, onSaved }: { encontro: Encontro; onSaved?: (treino: Encontro) => void }): React.JSX.Element {
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [pontoEncontro, setPontoEncontro] = useState<LatLng | null>(
    encontro.ponto_encontro_lat != null && encontro.ponto_encontro_lng != null
      ? { lat: Number(encontro.ponto_encontro_lat), lng: Number(encontro.ponto_encontro_lng) }
      : null
  );
  const [rotaCoords, setRotaCoords] = useState<LatLng[]>(Array.isArray(encontro.rota_coords) ? encontro.rota_coords : []);
  const [distanciaReal, setDistanciaReal] = useState(0);
  const [form, setForm] = useState({
    titulo: encontro.titulo || "",
    cidade: encontro.cidade || "",
    estado: encontro.estado || "",
    data_encontro: encontro.data_encontro || "",
    horario: encontro.horario || "",
    local_saida: encontro.local_saida || "",
    tipo_treino: encontro.tipo_treino || "",
    km_planejado: encontro.km_planejado ? String(encontro.km_planejado) : "",
    ritmo: encontro.ritmo || "",
    percurso: encontro.percurso || "",
    observacoes: encontro.observacoes || "",
    organizador_nome: encontro.organizador_nome || "",
  });

  function alterar(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/editar-encontro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encontroId: encontro.id,
          ...form,
          ponto_encontro_lat: pontoEncontro?.lat ?? null,
          ponto_encontro_lng: pontoEncontro?.lng ?? null,
          rota_coords: rotaCoords,
          distancia: distanciaReal > 0 ? `${distanciaReal.toFixed(2)} km` : encontro.distancia || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErro(result.error || "Não foi possível salvar o treino.");
        setLoading(false);
        return;
      }
      if (result.data) onSaved?.(result.data as Encontro);
      setAberto(false);
      setLoading(false);
    } catch {
      setErro("Erro de conexão ao salvar o treino.");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className="rounded-xl px-3 py-2 text-xs font-black"
        style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
        ✏️ EDITAR
      </button>
      {aberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6" style={{ background: "rgba(0,0,0,0.86)", backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && setAberto(false)}>
          <form onSubmit={salvar} className="mx-auto w-full max-w-2xl rounded-2xl p-5 shadow-2xl" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.25)" }}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>EDITAR TREINO</h3>
                <p className="text-xs" style={{ color: "#8B949E" }}>Altere data, horário, percurso e demais informações do treino.</p>
              </div>
              <button type="button" onClick={() => setAberto(false)} className="rounded-xl px-3 py-2 text-xs font-black" style={{ background: "rgba(255,255,255,0.06)", color: "#8B949E" }}>FECHAR</button>
            </div>
            {erro && <div className="mb-3 rounded-xl p-3 text-sm" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>{erro}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span style={labelStyle}>TÍTULO</span><input name="titulo" value={form.titulo} onChange={alterar} style={campoStyle} required /></label>
              <label><span style={labelStyle}>ORGANIZADOR</span><input name="organizador_nome" value={form.organizador_nome} onChange={alterar} style={campoStyle} /></label>
              <label><span style={labelStyle}>CIDADE</span><input name="cidade" value={form.cidade} onChange={alterar} style={campoStyle} required /></label>
              <label><span style={labelStyle}>ESTADO</span><input name="estado" value={form.estado} onChange={alterar} style={campoStyle} required maxLength={2} /></label>
              <label><span style={labelStyle}>DATA</span><input name="data_encontro" type="date" value={form.data_encontro} onChange={alterar} style={campoStyle} required /></label>
              <label><span style={labelStyle}>HORÁRIO</span><input name="horario" type="time" value={form.horario} onChange={alterar} style={campoStyle} required /></label>
              <label><span style={labelStyle}>LOCAL DE SAÍDA</span><input name="local_saida" value={form.local_saida} onChange={alterar} style={campoStyle} /></label>
              <label><span style={labelStyle}>TIPO DE TREINO</span><select name="tipo_treino" value={form.tipo_treino} onChange={alterar} style={campoStyle}>
                <option value="">Selecione</option>
                {["Caminhada longa","Corrida leve","Corrida moderada","Longão","Tiro","Fartlek","Intervalado","Regenerativo","Subida","Trail","Outro"].map(t => <option key={t} value={t}>{t}</option>)}
              </select></label>
              <label><span style={labelStyle}>KM PLANEJADO</span><input name="km_planejado" type="number" step="0.1" value={form.km_planejado} onChange={alterar} style={campoStyle} /></label>
              <label><span style={labelStyle}>RITMO</span><input name="ritmo" value={form.ritmo} onChange={alterar} style={campoStyle} /></label>
              <label className="sm:col-span-2"><span style={labelStyle}>PERCURSO</span><textarea name="percurso" value={form.percurso} onChange={alterar} style={{ ...campoStyle, minHeight: 80 }} /></label>
              <label className="sm:col-span-2"><span style={labelStyle}>OBSERVAÇÕES</span><textarea name="observacoes" value={form.observacoes} onChange={alterar} style={{ ...campoStyle, minHeight: 80 }} /></label>
            </div>
            <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(92,200,0,0.04)", border: "1px solid rgba(92,200,0,0.14)" }}>
              <p className="mb-2 text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                ALTERAR LOCAL E PERCURSO NO MAPA
              </p>
              <p className="mb-3 text-xs" style={{ color: "#8B949E" }}>
                Toque em LIMPAR para escolher um novo ponto. O primeiro toque no mapa marca o local de saída; os próximos toques traçam o percurso.
              </p>
              <MapaTreinoEditor
                pontoEncontro={pontoEncontro}
                setPontoEncontro={setPontoEncontro}
                rotaCoords={rotaCoords}
                setRotaCoords={setRotaCoords}
                onDistanciaChange={setDistanciaReal}
              />
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setAberto(false)} disabled={loading} className="flex-1 rounded-xl py-3 text-sm font-black" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>CANCELAR</button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl py-3 text-sm font-black" style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>{loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}</button>
            </div>
          </form>
        </div>
      )}
    </>
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
                    {treinoExpirado(e.data_encontro) && (
                      <span className="mt-2 inline-flex rounded-lg px-2 py-1 text-xs font-black" style={{ background: "rgba(255,107,0,0.12)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        DATA DO TREINO EXPIRADA · EDITE A DATA PARA REATIVAR
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={`/treinos/${e.id}`} className="rounded-xl px-4 py-2 text-xs font-black transition-all hover:brightness-110"
                      style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ABRIR →
                    </Link>
                    <BotaoEditarTreino encontro={e} onSaved={(treino) => setEncontros(prev => prev.map(item => item.id === treino.id ? { ...item, ...treino } : item))} />
                    <BotaoExcluir encontroId={e.id} titulo={e.titulo} onDeleted={(id) => setEncontros(prev => prev.filter(item => item.id !== id))} />
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
