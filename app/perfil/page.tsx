"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Camera, Edit2, Check, X, LogOut, ShoppingBag, Flag, Zap, ClipboardList, MapPin, Star, Trash2, Calendar, Ruler, ArrowRight } from "lucide-react";

type Treino = { id: number; titulo: string; cidade: string; estado: string; data_encontro: string; tipo_treino?: string; km_planejado?: number; distancia?: string };
type CidadeInteresse = { id: number; cidade: string; estado: string };
type EventoSalvo = { id: number; evento_id: number; eventos: { id: number; nome: string; cidade: string; estado: string; data_evento: string; distancia?: string; link_inscricao?: string } };

const ESTADOS_UF = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const inp = { background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none" } as React.CSSProperties;

function formatarData(data: string) {
  if (!data) return "—";
  const [, mes, dia] = String(data).split("-");
  return `${dia}/${mes}`;
}

function formatarDataCompleta(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function PerfilPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [nomeEditando, setNomeEditando] = useState(false);
  const [nomeTemp, setNomeTemp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Preferências
  const [cidadesInteresse, setCidadesInteresse] = useState<CidadeInteresse[]>([]);
  const [eventosSalvos, setEventosSalvos] = useState<EventoSalvo[]>([]);
  const [abaPref, setAbaPref] = useState<"cidades" | "eventos">("cidades");
  const [novaCidade, setNovaCidade] = useState("");
  const [novoEstado, setNovoEstado] = useState("PA");
  const [salvandoCidade, setSalvandoCidade] = useState(false);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [removendoEventoId, setRemovendoEventoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserEmail(user.email || "");
    setUserId(user.id);
    const nome = user.user_metadata?.nome_exibicao || user.email?.split("@")[0] || "Corredor";
    setNomeExibicao(nome); setNomeTemp(nome);
    setAvatarUrl(user.user_metadata?.avatar_url || null);

    const [{ data: adminRow }, { data: treinosData }, { data: cidades }, { data: eventos }] = await Promise.all([
      supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single(),
      supabase.from("encontros").select("id, titulo, cidade, estado, data_encontro, tipo_treino, km_planejado, distancia").eq("user_id", user.id).order("data_encontro", { ascending: false }),
      supabase.from("user_cidades_interesse").select("id, cidade, estado").eq("user_id", user.id).order("created_at"),
      supabase.from("user_eventos_salvos").select("id, evento_id, eventos(id, nome, cidade, estado, data_evento, distancia, link_inscricao)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setIsAdmin(!!adminRow);
    setTreinos(treinosData || []);
    setCidadesInteresse((cidades || []) as CidadeInteresse[]);
    setEventosSalvos((eventos || []) as unknown as EventoSalvo[]);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarNome() {
    setSalvandoNome(true);
    await supabase.auth.updateUser({ data: { nome_exibicao: nomeTemp.trim() } });
    setNomeExibicao(nomeTemp.trim()); setNomeEditando(false); setSalvandoNome(false);
  }

  async function uploadFoto(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 3 * 1024 * 1024) { alert("Imagem muito grande. Máximo 3MB."); return; }
    setUploadandoFoto(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true, contentType: file.type });
      if (uploadError) { alert("Erro no upload: " + uploadError.message); setUploadandoFoto(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
    } catch { alert("Erro ao fazer upload."); }
    setUploadandoFoto(false);
  }

  async function removerFoto() {
    if (!confirm("Remover foto de perfil?")) return;
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    setAvatarUrl(null);
  }

  async function adicionarCidade() {
    if (!novaCidade.trim() || !novoEstado) return;
    setSalvandoCidade(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("user_cidades_interesse").insert({
      user_id: user.id, cidade: novaCidade.trim(), estado: novoEstado,
    }).select("id, cidade, estado").single();
    if (!error && data) {
      setCidadesInteresse(prev => [...prev, data as CidadeInteresse]);
      setNovaCidade("");
    }
    setSalvandoCidade(false);
  }

  async function removerCidade(id: number) {
    setRemovendoId(id);
    await supabase.from("user_cidades_interesse").delete().eq("id", id);
    setCidadesInteresse(prev => prev.filter(c => c.id !== id));
    setRemovendoId(null);
  }

  async function removerEventoSalvo(id: number) {
    setRemovendoEventoId(id);
    await supabase.from("user_eventos_salvos").delete().eq("id", id);
    setEventosSalvos(prev => prev.filter(e => e.id !== id));
    setRemovendoEventoId(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut(); router.push("/login");
  }

  if (loading) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
      </main>
    </>
  );

  const inicial = nomeExibicao[0]?.toUpperCase() || "?";
  const totalKm = treinos.reduce((acc, t) => acc + (t.km_planejado || 0), 0);

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-10" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-3xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              {/* Avatar */}
              <div className="relative shrink-0 group">
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden"
                  style={{ boxShadow: avatarUrl ? "0 0 0 3px #5CC800" : "0 0 0 3px rgba(92,200,0,0.3)" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={nomeExibicao} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black"
                      style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {inicial}
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()} disabled={uploadandoFoto}
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.65)" }}>
                    {uploadandoFoto
                      ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      : <><Camera size={20} color="#fff" strokeWidth={2} /><span className="text-xs font-black mt-1" style={{ color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>TROCAR</span></>
                    }
                  </button>
                </div>
                {avatarUrl && !uploadandoFoto && (
                  <button onClick={removerFoto}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#FF6B00", color: "#fff" }}>✕</button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f); e.target.value = ""; }} />
              </div>

              {/* Info */}
              <div className="flex-1">
                {nomeEditando ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={nomeTemp} onChange={e => setNomeTemp(e.target.value)} autoFocus
                      className="flex-1 rounded-xl px-4 py-2 text-xl font-black"
                      style={{ background: "#21262D", border: "1px solid #5CC800", color: "#E6EDF3", outline: "none", fontFamily: "'Barlow Condensed', sans-serif" }} />
                    <button onClick={salvarNome} disabled={salvandoNome}
                      className="rounded-xl px-4 py-2 text-sm font-black"
                      style={{ background: "#5CC800", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {salvandoNome ? "..." : <span className="flex items-center gap-1"><Check size={14} strokeWidth={2.5} /> SALVAR</span>}
                    </button>
                    <button onClick={() => { setNomeEditando(false); setNomeTemp(nomeExibicao); }}
                      className="rounded-xl px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{nomeExibicao}</h1>
                    <button onClick={() => setNomeEditando(true)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
                      style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      <Edit2 size={11} strokeWidth={2.5} /> EDITAR
                    </button>
                  </div>
                )}
                <p className="mt-0.5 text-sm" style={{ color: "#8B949E" }}>{userEmail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-lg px-3 py-1 text-xs font-black"
                    style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {treinos.length} TREINO{treinos.length !== 1 ? "S" : ""}
                  </span>
                  <span className="rounded-lg px-3 py-1 text-xs font-black"
                    style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <MapPin size={10} style={{ display: "inline", marginRight: "3px" }} strokeWidth={2} />
                    {cidadesInteresse.length} CIDADE{cidadesInteresse.length !== 1 ? "S" : ""} FAVORITA{cidadesInteresse.length !== 1 ? "S" : ""}
                  </span>
                  <span className="rounded-lg px-3 py-1 text-xs font-black"
                    style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Star size={10} style={{ display: "inline", marginRight: "3px" }} strokeWidth={2} />
                    {eventosSalvos.length} EVENTO{eventosSalvos.length !== 1 ? "S" : ""} SALVO{eventosSalvos.length !== 1 ? "S" : ""}
                  </span>
                  {isAdmin && (
                    <span className="rounded-lg px-3 py-1 text-xs font-black"
                      style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ⚙️ ADMIN
                    </span>
                  )}
                </div>
              </div>

              <button onClick={handleLogout}
                className="shrink-0 self-start flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-black"
                style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <LogOut size={14} strokeWidth={2} /> SAIR
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: treinos.length, l: "TREINOS", cor: "#5CC800" },
              { v: `${totalKm}km`, l: "KM PLANEJADOS", cor: "#FF6B00" },
              { v: cidadesInteresse.length, l: "CIDADES FAV.", cor: "#FFB800" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                <p className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.cor }}>{s.v}</p>
                <p className="mt-1 text-xs font-bold" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* ── PREFERÊNCIAS ─────────────────────────────────────────── */}
          <section className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.2)" }}>
            {/* Header */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-1 rounded-full" style={{ background: "#FFB800" }} />
                <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.03em" }}>
                  MINHAS PREFERÊNCIAS
                </h2>
              </div>
              <p className="text-xs" style={{ color: "#8B949E" }}>
                Eventos das suas cidades favoritas aparecem na página inicial personalizada.
              </p>
            </div>

            {/* Abas */}
            <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {([
                { id: "cidades", label: "📍 CIDADES FAVORITAS", count: cidadesInteresse.length },
                { id: "eventos", label: "⭐ EVENTOS SALVOS", count: eventosSalvos.length },
              ] as const).map(a => (
                <button key={a.id} onClick={() => setAbaPref(a.id)}
                  className="flex-1 py-3 text-xs font-black transition-all"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
                    color: abaPref === a.id ? "#FFB800" : "#8B949E",
                    background: abaPref === a.id ? "rgba(255,184,0,0.08)" : "transparent",
                    borderBottom: abaPref === a.id ? "2px solid #FFB800" : "2px solid transparent",
                  }}>
                  {a.label} ({a.count})
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* ABA CIDADES */}
              {abaPref === "cidades" && (
                <div className="space-y-4">
                  {/* Adicionar cidade */}
                  <div className="rounded-xl p-4" style={{ background: "#21262D" }}>
                    <p className="text-xs font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
                      ADICIONAR CIDADE
                    </p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                      <input
                        type="text"
                        placeholder="Ex: Tucuruí, Belém, Manaus..."
                        value={novaCidade}
                        onChange={e => setNovaCidade(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && adicionarCidade()}
                        style={inp}
                      />
                      <select value={novoEstado} onChange={e => setNovoEstado(e.target.value)} style={inp}>
                        {ESTADOS_UF.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                      <button onClick={adicionarCidade} disabled={salvandoCidade || !novaCidade.trim()}
                        className="rounded-xl px-4 py-2 text-xs font-black transition-all hover:brightness-110 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", whiteSpace: "nowrap" }}>
                        {salvandoCidade ? "..." : "+ ADICIONAR"}
                      </button>
                    </div>
                  </div>

                  {/* Lista de cidades */}
                  {cidadesInteresse.length === 0 ? (
                    <div className="rounded-xl p-6 text-center" style={{ background: "#21262D", border: "1px dashed rgba(255,184,0,0.2)" }}>
                      <MapPin size={28} color="rgba(255,184,0,0.3)" strokeWidth={1.5} style={{ margin: "0 auto 8px" }} />
                      <p className="text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        NENHUMA CIDADE FAVORITA
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#8B949E" }}>
                        Adicione cidades para ver eventos personalizados na página inicial.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cidadesInteresse.map(c => (
                        <div key={c.id}
                          className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{ background: "#21262D", border: "1px solid rgba(255,184,0,0.1)" }}>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} color="#FFB800" strokeWidth={2} />
                            <span className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {c.cidade}
                            </span>
                            <span className="rounded-lg px-2 py-0.5 text-xs font-black"
                              style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {c.estado}
                            </span>
                          </div>
                          <button onClick={() => removerCidade(c.id)} disabled={removendoId === c.id}
                            className="rounded-lg p-1.5 transition-all hover:brightness-110"
                            style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>
                            {removendoId === c.id
                              ? <span className="h-3 w-3 block animate-spin rounded-full border border-orange-400 border-t-transparent" />
                              : <Trash2 size={13} strokeWidth={2} />
                            }
                          </button>
                        </div>
                      ))}
                      <Link href="/eventos"
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs font-black mt-2 transition-all hover:brightness-110"
                        style={{ background: "rgba(255,184,0,0.08)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        <Flag size={13} strokeWidth={2} />
                        VER EVENTOS NESSAS CIDADES
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* ABA EVENTOS SALVOS */}
              {abaPref === "eventos" && (
                <div className="space-y-3">
                  {eventosSalvos.length === 0 ? (
                    <div className="rounded-xl p-6 text-center" style={{ background: "#21262D", border: "1px dashed rgba(255,184,0,0.2)" }}>
                      <Star size={28} color="rgba(255,184,0,0.3)" strokeWidth={1.5} style={{ margin: "0 auto 8px" }} />
                      <p className="text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        NENHUM EVENTO SALVO
                      </p>
                      <p className="text-xs mt-1 mb-4" style={{ color: "#8B949E" }}>
                        Salve eventos na página de eventos clicando na estrela ⭐
                      </p>
                      <Link href="/eventos"
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black"
                        style={{ background: "linear-gradient(135deg, #FFB800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        <Flag size={13} strokeWidth={2} /> VER EVENTOS
                      </Link>
                    </div>
                  ) : (
                    eventosSalvos.map(es => {
                      const ev = es.eventos;
                      if (!ev) return null;
                      return (
                        <div key={es.id} className="relative overflow-hidden rounded-xl"
                          style={{ background: "#21262D", border: "1px solid rgba(255,184,0,0.15)" }}>
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #FFB800, transparent)" }} />
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-sm leading-tight mb-1"
                                  style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                  {ev.nome}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  <span className="flex items-center gap-1 text-xs" style={{ color: "#5CC800" }}>
                                    <Calendar size={10} strokeWidth={2} />{formatarDataCompleta(ev.data_evento)}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs" style={{ color: "#8B949E" }}>
                                    <MapPin size={10} strokeWidth={2} />{ev.cidade} — {ev.estado}
                                  </span>
                                  {ev.distancia && (
                                    <span className="flex items-center gap-1 text-xs" style={{ color: "#FF6B00" }}>
                                      <Ruler size={10} strokeWidth={2} />{ev.distancia}
                                    </span>
                                  )}
                                </div>
                                {ev.link_inscricao && (
                                  <a href={ev.link_inscricao} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-black transition-all hover:brightness-110"
                                    style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                    INSCREVER-SE <ArrowRight size={11} strokeWidth={2.5} />
                                  </a>
                                )}
                              </div>
                              <button onClick={() => removerEventoSalvo(es.id)} disabled={removendoEventoId === es.id}
                                className="shrink-0 rounded-lg p-1.5 transition-all hover:brightness-110"
                                style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>
                                {removendoEventoId === es.id
                                  ? <span className="h-3 w-3 block animate-spin rounded-full border border-orange-400 border-t-transparent" />
                                  : <Trash2 size={13} strokeWidth={2} />
                                }
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Meus treinos */}
          <section className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
                <h2 className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", fontSize: "18px", letterSpacing: "0.03em" }}>MEUS TREINOS</h2>
                <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{treinos.length}</span>
              </div>
              <Link href="/encontros" className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>+ CRIAR →</Link>
            </div>
            {treinos.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: "#21262D", border: "1px dashed rgba(92,200,0,0.2)" }}>
                <p className="text-sm" style={{ color: "#8B949E" }}>Você ainda não criou treinos.</p>
                <Link href="/encontros" className="mt-3 inline-flex rounded-xl px-4 py-2 text-sm font-black"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  CRIAR PRIMEIRO TREINO
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {treinos.slice(0, 5).map(t => (
                  <Link key={t.id} href={`/treinos/${t.id}`}
                    className="flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:brightness-110"
                    style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.1)" }}>
                    <div>
                      <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{t.titulo}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{t.cidade} · {formatarData(t.data_encontro)}{t.tipo_treino && ` · ${t.tipo_treino}`}</p>
                    </div>
                    <span className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {t.km_planejado ? `${t.km_planejado}km` : t.distancia || "→"}
                    </span>
                  </Link>
                ))}
                {treinos.length > 5 && (
                  <Link href="/meus-treinos" className="flex items-center justify-center gap-1 w-full rounded-xl py-2.5 text-xs font-black"
                    style={{ background: "rgba(92,200,0,0.08)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    VER TODOS ({treinos.length}) <ArrowRight size={12} strokeWidth={2.5} />
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* Links rápidos */}
          <section className="grid grid-cols-2 gap-3">
            {[
              { href: "/meus-treinos", Icon: ClipboardList, label: "GERENCIAR TREINOS", cor: "#5CC800", bg: "rgba(92,200,0,0.1)", border: "rgba(92,200,0,0.2)" },
              { href: "/loja", Icon: ShoppingBag, label: "VER A LOJA", cor: "#FF6B00", bg: "rgba(255,107,0,0.1)", border: "rgba(255,107,0,0.2)" },
              { href: "/eventos", Icon: Flag, label: "VER EVENTOS", cor: "#FFB800", bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.2)" },
              { href: "/encontros", Icon: Zap, label: "CRIAR TREINO", cor: "#5CC800", bg: "rgba(92,200,0,0.08)", border: "rgba(92,200,0,0.15)" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 rounded-xl p-4 transition-all hover:brightness-110"
                style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                <item.Icon size={18} strokeWidth={2} style={{ color: item.cor }} />
                <span className="font-black text-xs" style={{ color: item.cor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>{item.label}</span>
              </Link>
            ))}
          </section>

        </div>
      </main>
    </>
  );
}
