"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Camera, Edit2, Check, X, LogOut, ShoppingBag, Flag, Zap, ClipboardList,
  MapPin, Star, Trash2, Calendar, Ruler, ArrowRight, Users, Heart,
  MessageCircle, Activity, Flame, Trophy, Timer
, Send } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Treino = { id: number; titulo: string; cidade: string; estado: string; data_encontro: string; tipo_treino?: string; km_planejado?: number; distancia?: string; horario?: string; };
type TreinoParticipado = { id: number; encontro_id: number; encontros: { id: number; titulo: string; cidade: string; estado: string; data_encontro: string; tipo_treino?: string; km_planejado?: number; distancia?: string; } };
type CidadeInteresse = { id: number; cidade: string; estado: string };
type EventoSalvo = { id: number; evento_id: number; eventos: { id: number; nome: string; cidade: string; estado: string; data_evento: string; distancia?: string; link_inscricao?: string } };
type Post = { id: number; tipo: string; texto: string | null; fotos: string[]; atividade_distancia: number | null; atividade_tempo: string | null; atividade_pace: string | null; atividade_tipo: string | null; total_curtidas: number; total_comentarios: number; created_at: string; };

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

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── Componente principal ─────────────────────────────────────────────────────

// ─── ChatInline ──────────────────────────────────────────────────────────────
type MsgChat = { id: number; remetente_id: string; destinatario_id: string; texto: string; lida: boolean; created_at: string; };
type ConvChat = { outro_id: string; outro_nome: string; outro_avatar: string | null; ultima_msg: string; created_at: string; };

function ChatInline({ userId }: { userId: string | null }) {
  const supabase = createClient();
  const [conversas, setConversas] = React.useState<ConvChat[]>([]);
  const [ativa, setAtiva] = React.useState<string | null>(null);
  const [outroNome, setOutroNome] = React.useState("");
  const [outroAvatar, setOutroAvatar] = React.useState<string | null>(null);
  const [msgs, setMsgs] = React.useState<MsgChat[]>([]);
  const [texto, setTexto] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [carregando, setCarregando] = React.useState(true);
  const fimRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!userId) return;
    fetch("/api/mensagens", { credentials: "include" })
      .then(r => r.json())
      .then(async data => {
        const convs: ConvChat[] = [];
        for (const m of data.conversas || []) {
          const outro_id = m.remetente_id === userId ? m.destinatario_id : m.remetente_id;
          const { data: p } = await supabase.from("feed_posts").select("autor_nome, autor_avatar").eq("user_id", outro_id).limit(1).single();
          convs.push({ outro_id, outro_nome: p?.autor_nome || "Corredor", outro_avatar: p?.autor_avatar || null, ultima_msg: m.texto, created_at: m.created_at });
        }
        setConversas(convs);
        setCarregando(false);
      });
  }, [userId]); // eslint-disable-line

  async function abrirConversa(outro_id: string, nome: string, avatar: string | null) {
    setAtiva(outro_id); setOutroNome(nome); setOutroAvatar(avatar);
    const res = await fetch(`/api/mensagens?outro_id=${outro_id}`, { credentials: "include" });
    const data = await res.json();
    setMsgs(data.mensagens || []);
  }

  React.useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function enviar() {
    if (!texto.trim() || enviando || !ativa) return;
    setEnviando(true);
    const t = texto.trim(); setTexto("");
    const res = await fetch("/api/mensagens", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ destinatario_id: ativa, texto: t }),
    });
    const data = await res.json();
    if (data.success) setMsgs(prev => [...prev, data.mensagem]);
    setEnviando(false);
  }

  function tempoRel(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  if (!userId) return <div className="p-6 text-center" style={{ color: "#8B949E" }}>Faça login para ver mensagens</div>;

  if (ativa) return (
    <div className="flex flex-col" style={{ height: 400 }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#21262D" }}>
        <button onClick={() => setAtiva(null)} className="rounded-lg p-1" style={{ color: "#8B949E" }}>←</button>
        {outroAvatar ? <img src={outroAvatar} alt="" className="rounded-full object-cover" style={{ width: 32, height: 32 }} /> :
          <div className="rounded-full flex items-center justify-center font-black text-xs" style={{ width: 32, height: 32, background: "linear-gradient(135deg,#5CC800,#FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>{outroNome[0]?.toUpperCase()}</div>}
        <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{outroNome}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.map(m => {
          const minha = m.remetente_id === userId;
          return (
            <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs rounded-2xl px-3 py-2" style={{ background: minha ? "linear-gradient(135deg,#5CC800,#4aaa00)" : "#21262D", borderBottomRightRadius: minha ? 4 : 16, borderBottomLeftRadius: minha ? 16 : 4 }}>
                <p className="text-sm" style={{ color: minha ? "#fff" : "#E6EDF3" }}>{m.texto}</p>
                <p className="text-xs mt-0.5" style={{ color: minha ? "rgba(255,255,255,0.6)" : "#8B949E" }}>{tempoRel(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={fimRef} />
      </div>
      <div className="p-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <input value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviar()}
          placeholder="Digite uma mensagem..." className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3" }} />
        <button onClick={enviar} disabled={!texto.trim() || enviando}
          className="flex items-center justify-center rounded-xl px-3 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff" }}>
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );

  if (carregando) return <div className="p-8 text-center"><div className="h-6 w-6 animate-spin rounded-full border-2 mx-auto" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} /></div>;

  if (conversas.length === 0) return (
    <div className="p-8 text-center">
      <p className="text-3xl mb-2">💬</p>
      <p className="text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUMA CONVERSA</p>
      <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Acesse o perfil de um corredor e clique em "Mensagem"</p>
    </div>
  );

  return (
    <div className="divide-y divide-white/[0.04]">
      {conversas.map(c => (
        <button key={c.outro_id} onClick={() => abrirConversa(c.outro_id, c.outro_nome, c.outro_avatar)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
          {c.outro_avatar ? <img src={c.outro_avatar} alt="" className="rounded-full object-cover shrink-0" style={{ width: 40, height: 40 }} /> :
            <div className="rounded-full flex items-center justify-center shrink-0 font-black" style={{ width: 40, height: 40, background: "linear-gradient(135deg,#5CC800,#FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.outro_nome[0]?.toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.outro_nome}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: "#8B949E" }}>{c.ultima_msg}</p>
          </div>
          <p className="text-xs shrink-0" style={{ color: "#8B949E" }}>{tempoRel(c.created_at)}</p>
        </button>
      ))}
    </div>
  );
}

export default function PerfilPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();

  // Auth
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [nomeEditando, setNomeEditando] = useState(false);
  const [nomeTemp, setNomeTemp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Social
  const [seguidores, setSeguidores] = useState(0);
  const [seguindo, setSeguindo] = useState(0);

  // Dados
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [treinosParticipados, setTreinosParticipados] = useState<TreinoParticipado[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cidadesInteresse, setCidadesInteresse] = useState<CidadeInteresse[]>([]);
  const [eventosSalvos, setEventosSalvos] = useState<EventoSalvo[]>([]);

  // UI
  const [abaAtiva, setAbaAtiva] = useState<"publicacoes" | "treinos" | "participacoes" | "preferencias" | "estatisticas" | "conquistas">("publicacoes");
  const searchParams = useSearchParams();

  useEffect(() => {
    const msgUserId = searchParams.get("mensagem");
    if (msgUserId) router.push(`/chat?user=${encodeURIComponent(msgUserId)}`);
  }, [router, searchParams]);

  const [editandoPostId, setEditandoPostId] = useState<number | null>(null);
  const [textoEditPost, setTextoEditPost] = useState("");
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

    const [
      { data: adminRow },
      { data: treinosData },
      { data: participacoesData },
      { data: postsData },
      { data: cidades },
      { data: eventos },
      { count: seg },
      { count: seg2 },
    ] = await Promise.all([
      supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single(),
      supabase.from("encontros").select("id, titulo, cidade, estado, data_encontro, tipo_treino, km_planejado, distancia, horario").eq("user_id", user.id).order("data_encontro", { ascending: false }),
      supabase.from("encontro_participantes").select("id, encontro_id, encontros(id, titulo, cidade, estado, data_encontro, tipo_treino, km_planejado, distancia)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("feed_posts").select("id, tipo, texto, fotos, atividade_distancia, atividade_tempo, atividade_pace, atividade_tipo, total_curtidas, total_comentarios, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_cidades_interesse").select("id, cidade, estado").eq("user_id", user.id).order("created_at"),
      supabase.from("user_eventos_salvos").select("id, evento_id, eventos(id, nome, cidade, estado, data_evento, distancia, link_inscricao)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
    ]);

    setIsAdmin(!!adminRow);
    setTreinos(treinosData || []);
    setTreinosParticipados((participacoesData || []) as unknown as TreinoParticipado[]);
    setPosts(postsData || []);
    setCidadesInteresse((cidades || []) as CidadeInteresse[]);
    setEventosSalvos((eventos || []) as unknown as EventoSalvo[]);
    setSeguidores(seg ?? 0);
    setSeguindo(seg2 ?? 0);
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

  async function editarPost(id: number) {
    if (!textoEditPost.trim()) return;
    await fetch("/api/feed/posts", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ id, texto: textoEditPost }),
    });
    setPosts(prev => prev.map(p => p.id === id ? { ...p, texto: textoEditPost } : p));
    setEditandoPostId(null);
  }

  async function excluirPost(id: number) {
    if (!confirm("Excluir esta publicação?")) return;
    await fetch(`/api/feed/posts?id=${id}`, { method: "DELETE", credentials: "include" });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function adicionarCidade() {
    if (!novaCidade.trim() || !novoEstado) return;
    setSalvandoCidade(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("user_cidades_interesse").insert({ user_id: user.id, cidade: novaCidade.trim(), estado: novoEstado }).select("id, cidade, estado").single();
    if (!error && data) { setCidadesInteresse(prev => [...prev, data as CidadeInteresse]); setNovaCidade(""); }
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

  if (loading) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
      </main>
    </>
  );

  // Stats calculados
  const inicial = nomeExibicao[0]?.toUpperCase() || "?";
  const totalKmCriados = treinos.reduce((acc, t) => acc + (t.km_planejado || 0), 0);
  const totalKmParticipados = treinosParticipados.reduce((acc, p) => acc + (p.encontros?.km_planejado || 0), 0);
  const totalKmAtividades = posts.filter(p => p.tipo === "atividade").reduce((acc, p) => acc + (p.atividade_distancia || 0), 0);
  const totalKm = totalKmCriados + totalKmParticipados + totalKmAtividades;
  const totalCurtidas = posts.reduce((acc, p) => acc + p.total_curtidas, 0);
  const estadosFavoritosUnicos = [...new Set(cidadesInteresse.map(c => c.estado))];
  const linkEventosCidades = cidadesInteresse.length > 0 ? `/eventos?estado=${encodeURIComponent(estadosFavoritosUnicos.join(","))}` : "/eventos";

  const ABAS = [
    { id: "publicacoes", label: "📝 PUBLICAÇÕES", count: posts.length },
    { id: "treinos", label: "⚡ TREINOS", count: treinos.length },
    { id: "participacoes", label: "🏃 PARTICIPAÇÕES", count: treinosParticipados.length },
    { id: "preferencias", label: "⭐ PREFERÊNCIAS", count: cidadesInteresse.length + eventosSalvos.length },
    { id: "estatisticas", label: "📊 STATS", count: 0 },
    { id: "conquistas", label: "🏅 BADGES", count: 0 },
  ] as const;

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-4 py-10" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-3xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

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
                      : <><Camera size={20} color="#fff" strokeWidth={2} /><span className="text-xs font-black mt-1" style={{ color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>TROCAR</span></>}
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
                  <div className="flex items-center gap-2 mb-2">
                    <input type="text" value={nomeTemp} onChange={e => setNomeTemp(e.target.value)} autoFocus
                      className="flex-1 rounded-xl px-4 py-2 text-xl font-black"
                      style={{ background: "#21262D", border: "1px solid #5CC800", color: "#E6EDF3", outline: "none", fontFamily: "'Barlow Condensed', sans-serif" }} />
                    <button onClick={salvarNome} disabled={salvandoNome}
                      className="rounded-xl px-4 py-2 text-sm font-black"
                      style={{ background: "#5CC800", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {salvandoNome ? "..." : <span className="flex items-center gap-1"><Check size={14} strokeWidth={2.5} /> OK</span>}
                    </button>
                    <button onClick={() => { setNomeEditando(false); setNomeTemp(nomeExibicao); }}
                      className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-0.5">
                    <h1 className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{nomeExibicao}</h1>
                    <button onClick={() => setNomeEditando(true)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
                      style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      <Edit2 size={11} strokeWidth={2.5} /> EDITAR
                    </button>
                  </div>
                )}
                <p className="text-sm mb-3" style={{ color: "#8B949E" }}>{userEmail}</p>

                {/* Seguidores */}
                <div className="flex items-center gap-4 mb-3">
                  {[
                    { v: seguidores, l: "SEGUIDORES", cor: "#5CC800" },
                    { v: seguindo, l: "SEGUINDO", cor: "#FFB800" },
                    { v: posts.length, l: "POSTS", cor: "#5CC800" },
                  ].map((s, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.1)" }} />}
                      <div className="text-center">
                        <p className="text-lg font-black leading-none" style={{ color: s.cor, fontFamily: "'Barlow Condensed', sans-serif" }}>{s.v}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{s.l}</p>
                      </div>
                    </React.Fragment>
                  ))}
                  <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <Link href="/" className="flex items-center gap-1.5 text-xs font-black"
                    style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Users size={13} strokeWidth={2} /> COMUNIDADE
                  </Link>
                </div>

                {isAdmin && (
                  <span className="inline-flex rounded-lg px-3 py-1 text-xs font-black"
                    style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ⚙️ ADMIN
                  </span>
                )}
              </div>

              <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
                className="shrink-0 self-start flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-black"
                style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <LogOut size={14} strokeWidth={2} /> SAIR
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS CARDS ── */}
        <div className="px-4 py-4" style={{ background: "#161B22", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-3xl grid grid-cols-4 gap-3 sm:grid-cols-4">
            {[
              { v: `${totalKm.toFixed(1)}km`, l: "KM TOTAL", cor: "#5CC800", icon: "🏃" },
              { v: treinos.length, l: "TREINOS CRIADOS", cor: "#FF6B00", icon: "⚡" },
              { v: treinosParticipados.length, l: "PARTICIPAÇÕES", cor: "#FFB800", icon: "👥" },
              { v: totalCurtidas, l: "CURTIDAS", cor: "#FF6B00", icon: "❤️" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "#0D1117", border: "1px solid rgba(92,200,0,0.08)" }}>
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-xl font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.cor }}>{s.v}</p>
                <p className="text-xs mt-1 font-bold" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ABAS ── */}
        <div className="sticky top-0 z-10 px-4 py-2 overflow-x-auto" style={{ background: "#0D1117", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="mx-auto max-w-3xl flex gap-1 min-w-max">
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAbaAtiva(a.id)}
                className="whitespace-nowrap py-2 px-3 rounded-xl text-xs font-black transition-all"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
                  background: abaAtiva === a.id ? "rgba(92,200,0,0.15)" : "transparent",
                  color: abaAtiva === a.id ? "#5CC800" : "#8B949E",
                  border: abaAtiva === a.id ? "1px solid rgba(92,200,0,0.3)" : "1px solid transparent",
                }}>
                {a.label} ({a.count})
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTEÚDO DAS ABAS ── */}
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">

          {/* PUBLICAÇÕES */}
          {abaAtiva === "publicacoes" && (
            <>
              {posts.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.15)" }}>
                  <p className="text-4xl mb-2">📝</p>
                  <p className="font-black mb-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUMA PUBLICAÇÃO</p>
                  <Link href="/" className="inline-flex rounded-xl px-4 py-2 text-xs font-black mt-2"
                    style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    PUBLICAR NO FEED
                  </Link>
                </div>
              ) : (
                posts.map(post => (
                  <article key={post.id} className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.08)" }}>
                    <div className="h-0.5" style={{ background: post.tipo === "atividade" ? "linear-gradient(90deg, #FF6B00, #5CC800)" : "linear-gradient(90deg, #5CC800, #4aaa00)" }} />
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{tempoRelativo(post.created_at)}</p>
                        {post.tipo === "atividade" && (
                          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black"
                            style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            <Activity size={9} strokeWidth={2} /> ATIVIDADE
                          </span>
                        )}
                      </div>

                      {post.tipo === "atividade" && (post.atividade_distancia || post.atividade_tempo) && (
                        <div className="rounded-xl p-3 mb-3" style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.08), rgba(92,200,0,0.08))", border: "1px solid rgba(92,200,0,0.15)" }}>
                          <p className="text-xs font-black mb-2 flex items-center gap-1" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            <Flame size={11} strokeWidth={2} /> {post.atividade_tipo?.toUpperCase() || "CORRIDA"}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {post.atividade_distancia && <div>
                              <p className="text-xl font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_distancia}</p>
                              <p className="text-xs" style={{ color: "#8B949E" }}>km</p>
                            </div>}
                            {post.atividade_tempo && <div>
                              <p className="text-xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_tempo}</p>
                              <p className="text-xs" style={{ color: "#8B949E" }}>tempo</p>
                            </div>}
                            {post.atividade_pace && <div>
                              <p className="text-xl font-black" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_pace}</p>
                              <p className="text-xs" style={{ color: "#8B949E" }}>/km</p>
                            </div>}
                          </div>
                        </div>
                      )}

                      {editandoPostId === post.id ? (
                        <div className="mb-3 space-y-2">
                          <textarea value={textoEditPost} onChange={e => setTextoEditPost(e.target.value)} rows={3}
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
                            style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.3)", color: "#E6EDF3" }} />
                          <div className="flex gap-2">
                            <button onClick={() => editarPost(post.id)}
                              className="rounded-xl px-4 py-1.5 text-xs font-black"
                              style={{ background: "#5CC800", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>SALVAR</button>
                            <button onClick={() => setEditandoPostId(null)}
                              className="rounded-xl px-4 py-1.5 text-xs font-black" style={{ color: "#8B949E" }}>CANCELAR</button>
                          </div>
                        </div>
                      ) : post.texto ? (
                        <p className="text-sm leading-relaxed mb-3" style={{ color: "#C9D1D9" }}>{post.texto}</p>
                      ) : null}
                      {post.fotos?.length > 0 && (
                        <img src={post.fotos[0]} alt="" className="w-full object-cover rounded-xl mb-3" style={{ maxHeight: 280 }} />
                      )}

                      <div className="flex items-center gap-4 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="flex items-center gap-1.5 text-sm font-black" style={{ color: post.total_curtidas > 0 ? "#FF6B00" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          <Heart size={15} strokeWidth={2} fill={post.total_curtidas > 0 ? "#FF6B00" : "none"} />
                          {post.total_curtidas > 0 && post.total_curtidas}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          <MessageCircle size={15} strokeWidth={2} />
                          {post.total_comentarios > 0 && post.total_comentarios}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </>
          )}

          {/* TREINOS CRIADOS */}
          {abaAtiva === "treinos" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {treinos.length} treino{treinos.length !== 1 ? "s" : ""} criado{treinos.length !== 1 ? "s" : ""}
                  {totalKmCriados > 0 && ` · ${totalKmCriados}km planejados`}
                </p>
                <Link href="/encontros" className="flex items-center gap-1 text-xs font-black"
                  style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  + CRIAR <ArrowRight size={12} strokeWidth={2.5} />
                </Link>
              </div>
              {treinos.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.15)" }}>
                  <p className="text-4xl mb-2">⚡</p>
                  <p className="font-black mb-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUM TREINO CRIADO</p>
                  <Link href="/encontros" className="inline-flex rounded-xl px-4 py-2 text-xs font-black mt-2"
                    style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    CRIAR PRIMEIRO TREINO
                  </Link>
                </div>
              ) : (
                treinos.map(t => (
                  <Link key={t.id} href={`/treinos/${t.id}`}
                    className="flex items-start gap-3 rounded-2xl p-4 transition-all hover:brightness-110"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                      style={{ background: "rgba(92,200,0,0.1)" }}>
                      <p className="text-xs font-black leading-none" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {formatarData(t.data_encontro)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{t.titulo}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>
                        {t.cidade} — {t.estado}{t.tipo_treino ? ` · ${t.tipo_treino}` : ""}{t.horario ? ` · ${t.horario}` : ""}
                      </p>
                    </div>
                    {t.km_planejado ? (
                      <span className="text-sm font-black shrink-0" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {t.km_planejado}km
                      </span>
                    ) : t.distancia ? (
                      <span className="text-xs shrink-0" style={{ color: "#8B949E" }}>{t.distancia}</span>
                    ) : null}
                  </Link>
                ))
              )}
            </>
          )}

          {/* PARTICIPAÇÕES */}
          {abaAtiva === "participacoes" && (
            <>
              <p className="text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {treinosParticipados.length} participação{treinosParticipados.length !== 1 ? "s" : ""}
                {totalKmParticipados > 0 && ` · ${totalKmParticipados}km percorridos`}
              </p>
              {treinosParticipados.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(255,184,0,0.15)" }}>
                  <p className="text-4xl mb-2">🏃</p>
                  <p className="font-black mb-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUMA PARTICIPAÇÃO</p>
                  <Link href="/encontros" className="inline-flex rounded-xl px-4 py-2 text-xs font-black mt-2"
                    style={{ background: "linear-gradient(135deg, #FFB800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    VER TREINOS
                  </Link>
                </div>
              ) : (
                treinosParticipados.map(p => {
                  const t = p.encontros;
                  if (!t) return null;
                  return (
                    <Link key={p.id} href={`/treinos/${t.id}`}
                      className="flex items-start gap-3 rounded-2xl p-4 transition-all hover:brightness-110"
                      style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.1)" }}>
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                        style={{ background: "rgba(255,184,0,0.1)" }}>
                        <p className="text-xs font-black leading-none" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {formatarData(t.data_encontro)}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{t.titulo}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>
                          {t.cidade} — {t.estado}{t.tipo_treino ? ` · ${t.tipo_treino}` : ""}
                        </p>
                      </div>
                      {t.km_planejado ? (
                        <span className="text-sm font-black shrink-0" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {t.km_planejado}km
                        </span>
                      ) : null}
                    </Link>
                  );
                })
              )}
            </>
          )}

          {/* PREFERÊNCIAS */}
          {abaAtiva === "preferencias" && (
            <section className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.2)" }}>
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
                {abaPref === "cidades" && (
                  <div className="space-y-4">
                    <div className="rounded-xl p-4" style={{ background: "#21262D" }}>
                      <p className="text-xs font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>ADICIONAR CIDADE</p>
                      <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                        <input type="text" placeholder="Ex: Tucuruí, Belém, Manaus..." value={novaCidade}
                          onChange={e => setNovaCidade(e.target.value)} onKeyDown={e => e.key === "Enter" && adicionarCidade()} style={inp} />
                        <select value={novoEstado} onChange={e => setNovoEstado(e.target.value)} style={inp}>
                          {ESTADOS_UF.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                        <button onClick={adicionarCidade} disabled={salvandoCidade || !novaCidade.trim()}
                          className="rounded-xl px-4 py-2 text-xs font-black disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", whiteSpace: "nowrap" }}>
                          {salvandoCidade ? "..." : "+ ADD"}
                        </button>
                      </div>
                    </div>
                    {cidadesInteresse.length === 0 ? (
                      <p className="text-center text-sm py-4" style={{ color: "#8B949E" }}>Nenhuma cidade favorita ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {cidadesInteresse.map(c => (
                          <div key={c.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{ background: "#21262D", border: "1px solid rgba(255,184,0,0.1)" }}>
                            <div className="flex items-center gap-2">
                              <MapPin size={14} color="#FFB800" strokeWidth={2} />
                              <span className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.cidade}</span>
                              <span className="rounded-lg px-2 py-0.5 text-xs font-black"
                                style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.estado}</span>
                            </div>
                            <button onClick={() => removerCidade(c.id)} disabled={removendoId === c.id}
                              className="rounded-lg p-1.5" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>
                              {removendoId === c.id ? <span className="h-3 w-3 block animate-spin rounded-full border border-orange-400 border-t-transparent" /> : <Trash2 size={13} strokeWidth={2} />}
                            </button>
                          </div>
                        ))}
                        <Link href={linkEventosCidades}
                          className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs font-black"
                          style={{ background: "rgba(255,184,0,0.08)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          <Flag size={13} strokeWidth={2} /> VER EVENTOS NESSAS CIDADES <ArrowRight size={13} strokeWidth={2.5} />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {abaPref === "eventos" && (
                  <div className="space-y-3">
                    {eventosSalvos.length === 0 ? (
                      <div className="rounded-xl p-8 text-center">
                        <p className="text-3xl mb-2">⭐</p>
                        <p className="text-sm font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUM EVENTO SALVO</p>
                        <Link href="/eventos" className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black"
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
                            <div className="p-4 flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-sm mb-1" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{ev.nome}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="flex items-center gap-1 text-xs" style={{ color: "#5CC800" }}>
                                    <Calendar size={10} strokeWidth={2} />{formatarDataCompleta(ev.data_evento)}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs" style={{ color: "#8B949E" }}>
                                    <MapPin size={10} strokeWidth={2} />{ev.cidade} — {ev.estado}
                                  </span>
                                  {ev.distancia && <span className="flex items-center gap-1 text-xs" style={{ color: "#FF6B00" }}>
                                    <Ruler size={10} strokeWidth={2} />{ev.distancia}
                                  </span>}
                                </div>
                                {ev.link_inscricao && (
                                  <a href={ev.link_inscricao} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-black mt-2"
                                    style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                    INSCREVER-SE <ArrowRight size={11} strokeWidth={2.5} />
                                  </a>
                                )}
                              </div>
                              <button onClick={() => removerEventoSalvo(es.id)} disabled={removendoEventoId === es.id}
                                className="shrink-0 rounded-lg p-1.5" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>
                                {removendoEventoId === es.id ? <span className="h-3 w-3 block animate-spin rounded-full border border-orange-400 border-t-transparent" /> : <Trash2 size={13} strokeWidth={2} />}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ESTATÍSTICAS */}
          {abaAtiva === "estatisticas" && (() => {
            const atividades = posts.filter(p => p.tipo === "atividade");
            const kmPorMes: Record<string, number> = {};
            atividades.forEach(a => {
              const mes = a.created_at.slice(0, 7);
              kmPorMes[mes] = (kmPorMes[mes] || 0) + (a.atividade_distancia || 0);
            });
            const meses = Object.keys(kmPorMes).sort().slice(-6);
            const maxKm = Math.max(...meses.map(m => kmPorMes[m]), 1);
            const paces = atividades.filter(a => a.atividade_pace).map(a => {
              const [min, seg] = (a.atividade_pace || "0:0").split(":").map(Number);
              return min * 60 + (seg || 0);
            }).filter(p => p > 0);
            const melhorPace = paces.length > 0 ? Math.min(...paces) : null;
            const mediaPace = paces.length > 0 ? paces.reduce((a, b) => a + b, 0) / paces.length : null;
            const formatPace = (seg: number) => `${Math.floor(seg/60)}:${String(Math.round(seg%60)).padStart(2,"0")}`;
            const maiorDist = atividades.length > 0 ? Math.max(...atividades.map(a => a.atividade_distancia || 0)) : 0;
            const totalAtividades = atividades.length;
            const diasAtivos = new Set(atividades.map(a => a.created_at.slice(0, 10))).size;

            return (
              <section className="space-y-4">
                {/* Cards de resumo */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "ATIVIDADES", value: totalAtividades, unit: "total", cor: "#5CC800" },
                    { label: "DIAS ATIVOS", value: diasAtivos, unit: "dias", cor: "#FF6B00" },
                    { label: "MAIOR DIST.", value: maiorDist.toFixed(1), unit: "km", cor: "#FFB800" },
                    { label: "MELHOR PACE", value: melhorPace ? formatPace(melhorPace) : "--", unit: "min/km", cor: "#5CC800" },
                  ].map(item => (
                    <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-black mb-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{item.label}</p>
                      <p className="text-3xl font-black" style={{ color: item.cor, fontFamily: "'Barlow Condensed', sans-serif" }}>{item.value}</p>
                      <p className="text-xs" style={{ color: "#8B949E" }}>{item.unit}</p>
                    </div>
                  ))}
                </div>

                {/* Pace médio */}
                {mediaPace && (
                  <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
                    <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>PACE MÉDIO</p>
                    <p className="text-4xl font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{formatPace(mediaPace)} <span className="text-base" style={{ color: "#8B949E" }}>min/km</span></p>
                  </div>
                )}

                {/* Gráfico KM por mês */}
                {meses.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
                    <p className="text-xs font-black mb-4" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>KM POR MÊS</p>
                    <div className="flex items-end gap-2 h-32">
                      {meses.map(mes => {
                        const km = kmPorMes[mes];
                        const pct = (km / maxKm) * 100;
                        const [ano, m] = mes.split("-");
                        const nomeMes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(m)-1];
                        return (
                          <div key={mes} className="flex-1 flex flex-col items-center gap-1">
                            <p className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{km.toFixed(0)}</p>
                            <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(pct, 4)}%`, background: "linear-gradient(to top, #5CC800, #4aaa00)", minHeight: 4 }} />
                            <p className="text-xs" style={{ color: "#8B949E" }}>{nomeMes}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tipos de atividade */}
                {atividades.length > 0 && (() => {
                  const tipos: Record<string, number> = {};
                  atividades.forEach(a => { const t = a.atividade_tipo || "Corrida"; tipos[t] = (tipos[t] || 0) + 1; });
                  return (
                    <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.15)" }}>
                      <p className="text-xs font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>TIPOS DE ATIVIDADE</p>
                      <div className="space-y-2">
                        {Object.entries(tipos).sort((a, b) => b[1] - a[1]).map(([tipo, qtd]) => (
                          <div key={tipo} className="flex items-center gap-3">
                            <p className="text-sm font-black w-24 shrink-0" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{tipo}</p>
                            <div className="flex-1 rounded-full overflow-hidden" style={{ background: "#21262D", height: 8 }}>
                              <div className="h-full rounded-full" style={{ width: `${(qtd / totalAtividades) * 100}%`, background: "linear-gradient(90deg, #FF6B00, #FFB800)" }} />
                            </div>
                            <p className="text-xs font-black w-6 text-right" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{qtd}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {atividades.length === 0 && (
                  <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.2)" }}>
                    <p className="text-4xl mb-2">📊</p>
                    <p className="font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUMA ATIVIDADE AINDA</p>
                    <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Publique atividades no feed para ver suas estatísticas</p>
                  </div>
                )}
              </section>
            );
          })()}

          {/* CONQUISTAS */}
          {abaAtiva === "conquistas" && (() => {
            const atividades = posts.filter(p => p.tipo === "atividade");
            const totalKmAtiv = atividades.reduce((acc, a) => acc + (a.atividade_distancia || 0), 0);
            const maiorDist = atividades.length > 0 ? Math.max(...atividades.map(a => a.atividade_distancia || 0)) : 0;
            const totalCurtidas2 = posts.reduce((acc, p) => acc + p.total_curtidas, 0);

            const badges = [
              { id: "primeira_atividade", emoji: "🏃", nome: "Primeira Passada", desc: "Publicou sua primeira atividade", conquistado: atividades.length >= 1, progresso: Math.min(atividades.length, 1), meta: 1 },
              { id: "cinco_atividades", emoji: "⚡", nome: "Em Ritmo", desc: "5 atividades publicadas", conquistado: atividades.length >= 5, progresso: Math.min(atividades.length, 5), meta: 5 },
              { id: "vinte_atividades", emoji: "🔥", nome: "Corredor Dedicado", desc: "20 atividades publicadas", conquistado: atividades.length >= 20, progresso: Math.min(atividades.length, 20), meta: 20 },
              { id: "primeiro_5k", emoji: "🎯", nome: "Primeiro 5K", desc: "Correu 5km em uma atividade", conquistado: maiorDist >= 5, progresso: Math.min(maiorDist, 5), meta: 5 },
              { id: "primeiro_10k", emoji: "🏅", nome: "10K Club", desc: "Correu 10km em uma atividade", conquistado: maiorDist >= 10, progresso: Math.min(maiorDist, 10), meta: 10 },
              { id: "primeira_meia", emoji: "⭐", nome: "Meio Caminho", desc: "Correu uma meia maratona (21km)", conquistado: maiorDist >= 21, progresso: Math.min(maiorDist, 21), meta: 21 },
              { id: "maratona", emoji: "👑", nome: "Maratonista", desc: "Correu uma maratona completa (42km)", conquistado: maiorDist >= 42, progresso: Math.min(maiorDist, 42), meta: 42 },
              { id: "100km_total", emoji: "💯", nome: "100KM Club", desc: "100km acumulados em atividades", conquistado: totalKmAtiv >= 100, progresso: Math.min(totalKmAtiv, 100), meta: 100 },
              { id: "500km_total", emoji: "🚀", nome: "Ultra Runner", desc: "500km acumulados em atividades", conquistado: totalKmAtiv >= 500, progresso: Math.min(totalKmAtiv, 500), meta: 500 },
              { id: "primeiro_post", emoji: "📝", nome: "Voz da Comunidade", desc: "Publicou seu primeiro post", conquistado: posts.length >= 1, progresso: Math.min(posts.length, 1), meta: 1 },
              { id: "dez_curtidas", emoji: "❤️", nome: "Querido da Comunidade", desc: "Recebeu 10 curtidas no total", conquistado: totalCurtidas2 >= 10, progresso: Math.min(totalCurtidas2, 10), meta: 10 },
              { id: "primeiro_treino", emoji: "👥", nome: "Líder de Turma", desc: "Criou um treino em grupo", conquistado: treinos.length >= 1, progresso: Math.min(treinos.length, 1), meta: 1 },
              { id: "cinco_treinos", emoji: "🏆", nome: "Organizador", desc: "Criou 5 treinos em grupo", conquistado: treinos.length >= 5, progresso: Math.min(treinos.length, 5), meta: 5 },
              { id: "primeira_participacao", emoji: "🤝", nome: "Espírito de Equipe", desc: "Participou de um treino em grupo", conquistado: treinosParticipados.length >= 1, progresso: Math.min(treinosParticipados.length, 1), meta: 1 },
            ];

            const conquistados = badges.filter(b => b.conquistado).length;

            return (
              <section className="space-y-4">
                {/* Resumo */}
                <div className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, #1a1000, #161B22)", border: "1px solid rgba(255,184,0,0.3)" }}>
                  <p className="text-5xl font-black" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{conquistados}<span className="text-2xl" style={{ color: "#8B949E" }}>/{badges.length}</span></p>
                  <p className="text-xs font-black mt-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>BADGES CONQUISTADOS</p>
                  <div className="mt-3 rounded-full overflow-hidden" style={{ background: "#21262D", height: 6 }}>
                    <div className="h-full rounded-full" style={{ width: `${(conquistados / badges.length) * 100}%`, background: "linear-gradient(90deg, #FFB800, #FF6B00)" }} />
                  </div>
                </div>

                {/* Badges conquistados */}
                {badges.filter(b => b.conquistado).length > 0 && (
                  <div>
                    <p className="text-xs font-black mb-3" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>✅ CONQUISTADOS</p>
                    <div className="grid grid-cols-2 gap-3">
                      {badges.filter(b => b.conquistado).map(b => (
                        <div key={b.id} className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(255,184,0,0.1), rgba(255,107,0,0.05))", border: "1px solid rgba(255,184,0,0.3)" }}>
                          <p className="text-4xl mb-1">{b.emoji}</p>
                          <p className="font-black text-sm" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{b.nome}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{b.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badges em progresso */}
                {badges.filter(b => !b.conquistado).length > 0 && (
                  <div>
                    <p className="text-xs font-black mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>🔒 EM PROGRESSO</p>
                    <div className="space-y-2">
                      {badges.filter(b => !b.conquistado).map(b => (
                        <div key={b.id} className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl opacity-40">{b.emoji}</span>
                            <div className="flex-1">
                              <p className="font-black text-sm" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{b.nome}</p>
                              <p className="text-xs" style={{ color: "#8B949E" }}>{b.desc}</p>
                            </div>
                            <p className="text-xs font-black shrink-0" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{b.progresso.toFixed(0)}/{b.meta}</p>
                          </div>
                          <div className="rounded-full overflow-hidden" style={{ background: "#21262D", height: 4 }}>
                            <div className="h-full rounded-full" style={{ width: `${(b.progresso / b.meta) * 100}%`, background: "rgba(255,184,0,0.4)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })()}

          {/* Links rápidos */}
          <section className="grid grid-cols-2 gap-3 pt-2">
            {[
              { href: "/meus-treinos", Icon: ClipboardList, label: "GERENCIAR TREINOS", cor: "#5CC800", bg: "rgba(92,200,0,0.08)", border: "rgba(92,200,0,0.15)" },
              { href: "/loja", Icon: ShoppingBag, label: "VER A LOJA", cor: "#FF6B00", bg: "rgba(255,107,0,0.08)", border: "rgba(255,107,0,0.15)" },
              { href: linkEventosCidades, Icon: Flag, label: "VER EVENTOS", cor: "#FFB800", bg: "rgba(255,184,0,0.08)", border: "rgba(255,184,0,0.15)" },
              { href: "/encontros", Icon: Zap, label: "CRIAR TREINO", cor: "#5CC800", bg: "rgba(92,200,0,0.06)", border: "rgba(92,200,0,0.12)" },
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
