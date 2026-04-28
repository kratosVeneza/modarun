"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Heart, MessageCircle, Share2, Plus, Image as ImageIcon,
  Activity, Newspaper, X, Send, Flame, ExternalLink, Loader2,
  Flag, Zap, Timer, Users
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Post = {
  id: number; user_id: string; tipo: "post" | "atividade" | "noticia";
  texto: string | null; fotos: string[];
  atividade_distancia: number | null; atividade_tempo: string | null;
  atividade_pace: string | null; atividade_tipo: string | null;
  noticia_titulo: string | null; noticia_url: string | null;
  noticia_fonte: string | null; noticia_imagem: string | null;
  total_curtidas: number; total_comentarios: number; created_at: string;
  autor_nome: string | null; autor_avatar: string | null; autor_email: string | null;
};

type Noticia = { titulo: string; url: string; fonte: string; imagem: string | null; data: string; resumo: string; };
type Comentario = { id: number; texto: string; created_at: string; autor_nome: string; autor_avatar: string | null; };
type EventoDestaque = { id: number; nome: string; cidade: string; estado: string; data_evento: string; distancia?: string; link_inscricao?: string; destaque?: boolean; };
type Treino = { id: number; titulo: string; cidade: string; estado: string; data_encontro: string; horario?: string; tipo_treino?: string; km_planejado?: number; distancia?: string; };

// ─── Utils ───────────────────────────────────────────────────────────────────

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

function iniciais(nome: string | null, email: string | null): string {
  if (nome) return nome.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

function nomeExibicao(nome: string | null, email: string | null): string {
  if (nome) return nome;
  if (email) return email.split("@")[0];
  return "Corredor";
}

function formatarData(data: string) {
  if (!data) return "—";
  const [, mes, dia] = String(data).split("-");
  return `${dia}/${mes}`;
}

// ─── Componentes menores ──────────────────────────────────────────────────────

function Avatar({ nome, avatar, email, size = 40 }: { nome: string | null; avatar: string | null; email: string | null; size?: number }) {
  const [erro, setErro] = useState(false);
  if (avatar && !erro) {
    return <img src={avatar} alt="" onError={() => setErro(true)} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-black text-sm"
      style={{ width: size, height: size, background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
      {iniciais(nome, email)}
    </div>
  );
}

function CardComentarios({ postId, total, usuarioLogado }: { postId: number; total: number; usuarioLogado: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await fetch(`/api/feed/comentarios?post_id=${postId}`);
    const data = await res.json();
    setComentarios(data.comentarios || []);
    setCarregando(false);
  }

  function toggle() { if (!aberto) carregar(); setAberto(v => !v); }

  async function enviar() {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    await fetch("/api/feed/comentarios", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ post_id: postId, texto }),
    });
    setTexto(""); await carregar(); setEnviando(false);
  }

  return (
    <div>
      <button onClick={toggle} className="flex items-center gap-1.5 text-sm transition-colors hover:text-green-400"
        style={{ color: aberto ? "#5CC800" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
        <MessageCircle size={16} strokeWidth={2} />
        {total > 0 ? total : ""} {total === 1 ? "COMENTÁRIO" : "COMENTÁRIOS"}
      </button>
      {aberto && (
        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {carregando ? (
            <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin" style={{ color: "#5CC800" }} /></div>
          ) : comentarios.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: "#8B949E" }}>Nenhum comentário ainda. Seja o primeiro!</p>
          ) : (
            comentarios.map(c => (
              <div key={c.id} className="flex gap-2">
                {c.autor_avatar ? (
                  <img src={c.autor_avatar} alt="" className="rounded-full object-cover shrink-0" style={{ width: 28, height: 28 }} />
                ) : (
                  <div className="rounded-full flex items-center justify-center shrink-0 font-black text-xs"
                    style={{ width: 28, height: 28, background: "rgba(92,200,0,0.15)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {c.autor_nome[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "#21262D" }}>
                  <span className="text-xs font-black mr-2" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.autor_nome}</span>
                  <span className="text-sm" style={{ color: "#C9D1D9" }}>{c.texto}</span>
                  <p className="text-xs mt-1" style={{ color: "#8B949E" }}>{tempoRelativo(c.created_at)}</p>
                </div>
              </div>
            ))
          )}
          {usuarioLogado && (
            <div className="flex gap-2 pt-1">
              <input value={texto} onChange={e => setTexto(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
                placeholder="Escreva um comentário..."
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3" }} />
              <button onClick={enviar} disabled={!texto.trim() || enviando}
                className="flex items-center justify-center rounded-xl px-3 transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff" }}>
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardPost({ post, usuarioLogado, userId, onDelete }: {
  post: Post; usuarioLogado: boolean; userId: string | null; onDelete: (id: number) => void;
}) {
  const [curtido, setCurtido] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(post.total_curtidas);
  const [curtindo, setCurtindo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [seguindo, setSeguindo] = useState(false);
  const [carregandoFollow, setCarregandoFollow] = useState(false);

  async function toggleCurtida() {
    if (!usuarioLogado || curtindo) return;
    setCurtindo(true);
    const acao = curtido ? "descurtir" : "curtir";
    setCurtido(v => !v); setTotalCurtidas(v => v + (curtido ? -1 : 1));
    await fetch("/api/feed/curtir", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ post_id: post.id, acao }),
    });
    setCurtindo(false);
  }

  async function toggleFollow() {
    if (!usuarioLogado || carregandoFollow || userId === post.user_id) return;
    setCarregandoFollow(true);
    const acao = seguindo ? "desseguir" : "seguir";
    setSeguindo(v => !v);
    await fetch("/api/feed/follows", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ following_id: post.user_id, acao }),
    });
    setCarregandoFollow(false);
  }

  async function compartilhar() {
    const url = `${window.location.origin}/#post-${post.id}`;
    if (navigator.share) { try { await navigator.share({ title: "Post Moda Run", url }); return; } catch { /* fallback */ } }
    await navigator.clipboard.writeText(url);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  }

  async function deletar() {
    if (!confirm("Deletar este post?")) return;
    await fetch(`/api/feed/posts?id=${post.id}`, { method: "DELETE", credentials: "include" });
    onDelete(post.id);
  }

  if (post.tipo === "noticia") {
    return (
      <article id={`post-${post.id}`} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
        style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #FF6B00, #FFB800)" }} />
        <a href={post.noticia_url ?? "#"} target="_blank" rel="noreferrer" className="block">
          {post.noticia_imagem && (
            <div className="relative overflow-hidden" style={{ height: 180 }}>
              <img src={post.noticia_imagem} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(22,27,34,0.8), transparent)" }} />
              <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black"
                style={{ background: "rgba(255,107,0,0.9)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Newspaper size={10} strokeWidth={2} /> NOTÍCIA
              </span>
            </div>
          )}
          <div className="p-4">
            {!post.noticia_imagem && (
              <span className="flex items-center gap-1 mb-2 text-xs font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Newspaper size={12} strokeWidth={2} /> NOTÍCIA
              </span>
            )}
            <h3 className="font-black text-base leading-tight mb-1" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.noticia_titulo}</h3>
            <p className="text-xs flex items-center gap-1 mt-1" style={{ color: "#8B949E" }}>
              <ExternalLink size={10} strokeWidth={2} /> {post.noticia_fonte}
            </p>
          </div>
        </a>
      </article>
    );
  }

  return (
    <article id={`post-${post.id}`} className="rounded-2xl overflow-hidden"
      style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.08)" }}>
      <div className="h-0.5 w-full" style={{ background: post.tipo === "atividade" ? "linear-gradient(90deg, #FF6B00, #5CC800)" : "linear-gradient(90deg, #5CC800, #4aaa00)" }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar nome={post.autor_nome} avatar={post.autor_avatar} email={post.autor_email} size={38} />
            <div>
              <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {nomeExibicao(post.autor_nome, post.autor_email)}
              </p>
              <p className="text-xs" style={{ color: "#8B949E" }}>{tempoRelativo(post.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.tipo === "atividade" && (
              <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black"
                style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", border: "1px solid rgba(255,107,0,0.3)" }}>
                <Activity size={10} strokeWidth={2} /> ATIVIDADE
              </span>
            )}
            {usuarioLogado && userId !== post.user_id && (
              <button onClick={toggleFollow} disabled={carregandoFollow}
                className="rounded-full px-3 py-1 text-xs font-black transition-all hover:scale-105 disabled:opacity-60"
                style={{
                  background: seguindo ? "rgba(92,200,0,0.15)" : "rgba(92,200,0,0.08)",
                  color: seguindo ? "#5CC800" : "#8B949E",
                  border: seguindo ? "1px solid rgba(92,200,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}>
                {seguindo ? "SEGUINDO" : "+ SEGUIR"}
              </button>
            )}
            {userId === post.user_id && (
              <button onClick={deletar} className="rounded-lg p-1.5 transition-colors hover:bg-red-500/10" style={{ color: "#8B949E" }}>
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {post.tipo === "atividade" && (post.atividade_distancia || post.atividade_tempo) && (
          <div className="rounded-2xl p-4 mb-3" style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.1), rgba(92,200,0,0.1))", border: "1px solid rgba(92,200,0,0.2)" }}>
            <div className="flex items-center gap-1.5 mb-3">
              <Flame size={14} strokeWidth={2} style={{ color: "#FF6B00" }} />
              <span className="text-xs font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {post.atividade_tipo?.toUpperCase() || "CORRIDA"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {post.atividade_distancia && (
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_distancia}</p>
                  <p className="text-xs" style={{ color: "#8B949E" }}>km</p>
                </div>
              )}
              {post.atividade_tempo && (
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_tempo}</p>
                  <p className="text-xs" style={{ color: "#8B949E" }}>tempo</p>
                </div>
              )}
              {post.atividade_pace && (
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_pace}</p>
                  <p className="text-xs" style={{ color: "#8B949E" }}>/km</p>
                </div>
              )}
            </div>
          </div>
        )}

        {post.texto && <p className="text-sm leading-relaxed mb-3" style={{ color: "#C9D1D9" }}>{post.texto}</p>}

        {post.fotos?.length > 0 && (
          <div className="relative overflow-hidden rounded-xl mb-3 cursor-pointer" style={{ maxHeight: 360 }}>
            <img src={post.fotos[fotoAtiva]} alt="" className="w-full object-cover rounded-xl" style={{ maxHeight: 360 }} />
            {post.fotos.length > 1 && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                {post.fotos.map((_, i) => (
                  <button key={i} onClick={() => setFotoAtiva(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === fotoAtiva ? 16 : 8, height: 8, background: i === fotoAtiva ? "#5CC800" : "rgba(255,255,255,0.5)" }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-4">
            <button onClick={toggleCurtida} disabled={!usuarioLogado}
              className="flex items-center gap-1.5 text-sm font-black transition-all hover:scale-105 disabled:cursor-default"
              style={{ color: curtido ? "#FF6B00" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
              <Heart size={16} strokeWidth={2} fill={curtido ? "#FF6B00" : "none"} />
              {totalCurtidas > 0 && totalCurtidas}
            </button>
            <CardComentarios postId={post.id} total={post.total_comentarios} usuarioLogado={usuarioLogado} />
          </div>
          <button onClick={compartilhar}
            className="flex items-center gap-1.5 text-xs font-black transition-colors hover:text-green-400"
            style={{ color: copiado ? "#5CC800" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <Share2 size={14} strokeWidth={2} />
            {copiado ? "COPIADO!" : ""}
          </button>
        </div>
      </div>
    </article>
  );
}

function CardNoticia({ noticia }: { noticia: Noticia }) {
  return (
    <a href={noticia.url} target="_blank" rel="noreferrer"
      className="block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.12)" }}>
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, #FF6B00, #FFB800)" }} />
      {noticia.imagem && (
        <div className="relative overflow-hidden" style={{ height: 140 }}>
          <img src={noticia.imagem} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(22,27,34,0.9), transparent 50%)" }} />
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-center gap-1 mb-1.5">
          <Newspaper size={10} strokeWidth={2} style={{ color: "#FF6B00" }} />
          <span className="text-xs font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{noticia.fonte}</span>
        </div>
        <h4 className="font-black text-sm leading-tight" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{noticia.titulo}</h4>
        {noticia.resumo && <p className="text-xs mt-1 line-clamp-2" style={{ color: "#8B949E" }}>{noticia.resumo}</p>}
      </div>
    </a>
  );
}

function ModalCriarPost({ onClose, onPublicado }: { onClose: () => void; onPublicado: (post: Post) => void }) {
  const [tipo, setTipo] = useState<"post" | "atividade">("post");
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [distancia, setDistancia] = useState("");
  const [tempo, setTempo] = useState("");
  const [pace, setPace] = useState("");
  const [tipoAtiv, setTipoAtiv] = useState("Corrida");
  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (distancia && tempo) {
      const [h = "0", m = "0", s = "0"] = tempo.split(":");
      const totalSec = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
      const km = parseFloat(distancia);
      if (km > 0 && totalSec > 0) {
        const paceS = totalSec / km;
        const paceMin = Math.floor(paceS / 60);
        const paceSec = Math.floor(paceS % 60);
        setPace(`${paceMin}:${String(paceSec).padStart(2, "0")}`);
      }
    }
  }, [distancia, tempo]);

  async function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const nome = `feed/${user.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from("avatars").upload(nome, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(nome);
      setFotos(prev => [...prev, urlData.publicUrl]);
    }
  }

  async function publicar() {
    if (publicando) return;
    setErro("");
    if (tipo === "post" && !texto.trim() && fotos.length === 0) { setErro("Escreva algo ou adicione uma foto."); return; }
    setPublicando(true);
    const res = await fetch("/api/feed/posts", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({
        tipo, texto: texto.trim() || null, fotos,
        atividade_distancia: distancia ? parseFloat(distancia) : null,
        atividade_tempo: tempo || null, atividade_pace: pace || null, atividade_tipo: tipoAtiv,
      }),
    });
    const data = await res.json();
    if (data.success) { onPublicado(data.post); onClose(); }
    else setErro(data.error || "Erro ao publicar.");
    setPublicando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />
        <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {([["post", "📝 POST"], ["atividade", "🏃 ATIVIDADE"]] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTipo(t)}
              className="flex-1 py-3 text-sm font-black transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", color: tipo === t ? "#5CC800" : "#8B949E", borderBottom: tipo === t ? "2px solid #5CC800" : "2px solid transparent", background: "transparent" }}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-4 space-y-4">
          {tipo === "atividade" && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)" }}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-black mb-1 block" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>TIPO</label>
                  <select value={tipoAtiv} onChange={e => setTipoAtiv(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: "#21262D", border: "1px solid rgba(255,107,0,0.3)", color: "#E6EDF3" }}>
                    {["Corrida", "Caminhada", "Trilha", "Bike", "Natação", "Musculação"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black mb-1 block" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>DISTÂNCIA (km)</label>
                  <input type="number" step="0.1" value={distancia} onChange={e => setDistancia(e.target.value)} placeholder="5.0"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-black mb-1 block" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>TEMPO (hh:mm:ss)</label>
                  <input type="text" value={tempo} onChange={e => setTempo(e.target.value)} placeholder="00:25:00"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "#21262D", border: "1px solid rgba(255,255,255,0.1)", color: "#E6EDF3" }} />
                </div>
                <div>
                  <label className="text-xs font-black mb-1 block" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>PACE (/km)</label>
                  <input type="text" value={pace} readOnly placeholder="Calculado"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: "#21262D", border: "1px solid rgba(255,184,0,0.2)", color: "#FFB800" }} />
                </div>
              </div>
            </div>
          )}
          <textarea value={texto} onChange={e => setTexto(e.target.value)}
            placeholder={tipo === "atividade" ? "Conta como foi a atividade..." : "O que você quer compartilhar com a comunidade?"}
            rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.15)", color: "#E6EDF3" }} />
          {fotos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {fotos.map((f, i) => (
                <div key={i} className="relative">
                  <img src={f} alt="" className="rounded-lg object-cover" style={{ width: 72, height: 72 }} />
                  <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center"
                    style={{ width: 18, height: 18, background: "#FF6B00", color: "#fff" }}>
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {erro && <p className="text-xs text-center" style={{ color: "#FF6B00" }}>{erro}</p>}
          <div className="flex items-center justify-between pt-1">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all hover:scale-105"
              style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              <ImageIcon size={14} strokeWidth={2} /> FOTO
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={selecionarFoto} />
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>CANCELAR</button>
              <button onClick={publicar} disabled={publicando}
                className="rounded-xl px-5 py-2 text-sm font-black transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {publicando ? "PUBLICANDO..." : "PUBLICAR"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function HomePage(): React.JSX.Element {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [proximosEventos, setProximosEventos] = useState<EventoDestaque[]>([]);
  const [proximosTreinos, setProximosTreinos] = useState<Treino[]>([]);
  const [totalTreinos, setTotalTreinos] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"feed" | "noticias">("feed");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { id: u.id, email: u.email } : null);
      if (u?.email) {
        supabase.from("admins").select("email").eq("email", u.email.toLowerCase()).single()
          .then(({ data }) => setIsAdmin(!!data));
      }
    });

    // Carregar eventos e treinos próximos
    const hoje = new Date().toISOString().split("T")[0];
    supabase.from("eventos").select("id, nome, cidade, estado, data_evento, distancia, link_inscricao, destaque")
      .gte("data_evento", hoje).order("destaque", { ascending: false }).order("data_evento", { ascending: true }).limit(3)
      .then(({ data }) => setProximosEventos(data || []));

    supabase.from("encontros").select("id, titulo, cidade, estado, data_encontro, horario, tipo_treino, km_planejado, distancia")
      .gte("data_encontro", hoje).order("data_encontro", { ascending: true }).limit(3)
      .then(({ data }) => setProximosTreinos(data || []));

    supabase.from("encontros").select("*", { count: "exact", head: true })
      .then(({ count }) => setTotalTreinos(count || 0));

    fetch("/api/feed/noticias").then(r => r.json()).then(d => setNoticias(d.noticias || []));
  }, []); // eslint-disable-line

  const carregarPosts = useCallback(async (pag = 0) => {
    if (pag === 0) setCarregando(true); else setCarregandoMais(true);
    const res = await fetch(`/api/feed/posts?page=${pag}`);
    const data = await res.json();
    if (pag === 0) setPosts(data.posts || []); else setPosts(prev => [...prev, ...(data.posts || [])]);
    setTemMais(data.tem_mais); setPagina(pag);
    if (pag === 0) setCarregando(false); else setCarregandoMais(false);
  }, []);

  useEffect(() => { carregarPosts(0); }, [carregarPosts]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && temMais && !carregandoMais) carregarPosts(pagina + 1);
    }, { threshold: 0.1 });
    if (sentinelaRef.current) observerRef.current.observe(sentinelaRef.current);
    return () => observerRef.current?.disconnect();
  }, [temMais, carregandoMais, pagina, carregarPosts]);

  function novoPost(post: Post) { setPosts(prev => [post, ...prev]); }
  function deletarPost(id: number) { setPosts(prev => prev.filter(p => p.id !== id)); }

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* ── HERO / BOAS-VINDAS ── */}
        {!user && (
          <section className="relative overflow-hidden px-4 py-16" style={{ background: "linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)" }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -right-40 top-0 h-96 w-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #5CC800, transparent 70%)" }} />
              <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#5CC800" strokeWidth="0.5"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            <div className="relative mx-auto max-w-2xl text-center">
              <h1 className="text-5xl font-black leading-none sm:text-6xl mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span style={{ color: "#E6EDF3" }}>CORRA NA </span><span style={{ color: "#5CC800" }}>MODA.</span>
              </h1>
              <p className="text-base mb-6" style={{ color: "#8B949E" }}>
                Comunidade de corredores. Compartilhe atividades, encontre treinos e descubra corridas no Brasil.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/cadastro" className="rounded-xl px-6 py-3 font-black text-sm"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  🚀 CRIAR CONTA GRÁTIS
                </Link>
                <Link href="/login" className="rounded-xl px-6 py-3 font-black text-sm"
                  style={{ border: "2px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  JÁ TENHO CONTA
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── DESTAQUES RÁPIDOS (logado) ── */}
        {user && (proximosEventos.length > 0 || proximosTreinos.length > 0) && (
          <section className="px-4 py-5" style={{ background: "#161B22", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="mx-auto max-w-2xl">
              <div className="grid grid-cols-3 gap-3">
                <Link href="/encontros" className="rounded-xl p-3 flex flex-col items-center gap-1 transition-all hover:brightness-110"
                  style={{ background: "rgba(92,200,0,0.08)", border: "1px solid rgba(92,200,0,0.15)" }}>
                  <Zap size={18} strokeWidth={2} style={{ color: "#5CC800" }} />
                  <p className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{totalTreinos} TREINOS</p>
                </Link>
                <Link href="/eventos" className="rounded-xl p-3 flex flex-col items-center gap-1 transition-all hover:brightness-110"
                  style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.15)" }}>
                  <Flag size={18} strokeWidth={2} style={{ color: "#FF6B00" }} />
                  <p className="text-xs font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>EVENTOS</p>
                </Link>
                <Link href="/ferramentas" className="rounded-xl p-3 flex flex-col items-center gap-1 transition-all hover:brightness-110"
                  style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.15)" }}>
                  <Timer size={18} strokeWidth={2} style={{ color: "#FFB800" }} />
                  <p className="text-xs font-black" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>FERRAMENTAS</p>
                </Link>
              </div>

              {proximosEventos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>PRÓXIMAS CORRIDAS</p>
                  <div className="space-y-2">
                    {proximosEventos.slice(0, 2).map(e => (
                      <Link key={e.id} href="/eventos"
                        className="flex items-center gap-3 rounded-xl p-3 transition-all hover:brightness-110"
                        style={{ background: "#21262D", border: "1px solid rgba(255,107,0,0.1)" }}>
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg"
                          style={{ background: "rgba(255,107,0,0.15)" }}>
                          <p className="text-xs font-black leading-none" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{formatarData(e.data_evento)}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-sm truncate" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{e.nome}</p>
                          <p className="text-xs" style={{ color: "#8B949E" }}>{e.cidade} — {e.estado}{e.distancia ? ` · ${e.distancia}` : ""}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── FEED + PUBLICAR ── */}
        <div className="px-4 pt-5 pb-2">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
                🏃 COMUNIDADE
              </h2>
              {user && (
                <button onClick={() => setModalAberto(true)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-black text-sm transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(92,200,0,0.3)" }}>
                  <Plus size={16} strokeWidth={2.5} /> PUBLICAR
                </button>
              )}
            </div>

            {user && (
              <button onClick={() => setModalAberto(true)} className="w-full rounded-2xl p-4 text-left mb-4 transition-all hover:border-green-500/30"
                style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.12)" }}>
                <div className="flex items-center gap-3">
                  <Avatar nome={null} avatar={null} email={user.email ?? null} size={36} />
                  <span className="text-sm" style={{ color: "#8B949E" }}>Compartilhe sua corrida, resultado ou dica...</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <ImageIcon size={10} strokeWidth={2} /> FOTO
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Activity size={10} strokeWidth={2} /> ATIVIDADE
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Abas feed/notícias */}
        <div className="sticky top-0 z-10 px-4 py-2" style={{ background: "#0D1117", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="mx-auto max-w-2xl flex gap-1">
            {([["feed", "🏃 FEED"], ["noticias", "📰 NOTÍCIAS"]] as const).map(([aba, label]) => (
              <button key={aba} onClick={() => setAbaAtiva(aba)}
                className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
                  background: abaAtiva === aba ? "rgba(92,200,0,0.15)" : "transparent",
                  color: abaAtiva === aba ? "#5CC800" : "#8B949E",
                  border: abaAtiva === aba ? "1px solid rgba(92,200,0,0.3)" : "1px solid transparent",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {abaAtiva === "feed" && (
              <>
                {carregando ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: "#161B22", height: 160 }} />
                  ))
                ) : posts.length === 0 ? (
                  <div className="rounded-2xl p-12 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.2)" }}>
                    <p className="text-5xl mb-3">🏃</p>
                    <p className="font-black text-lg mb-1" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>FEED VAZIO</p>
                    <p className="text-sm mb-4" style={{ color: "#8B949E" }}>Seja o primeiro a publicar na comunidade!</p>
                    {user && (
                      <button onClick={() => setModalAberto(true)}
                        className="rounded-xl px-5 py-2.5 font-black text-sm"
                        style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        PUBLICAR AGORA
                      </button>
                    )}
                  </div>
                ) : (
                  posts.map(post => (
                    <CardPost key={post.id} post={post} usuarioLogado={!!user} userId={user?.id ?? null} onDelete={deletarPost} />
                  ))
                )}
                <div ref={sentinelaRef} className="h-4" />
                {carregandoMais && (
                  <div className="flex justify-center py-4">
                    <Loader2 size={24} className="animate-spin" style={{ color: "#5CC800" }} />
                  </div>
                )}
                {!temMais && posts.length > 0 && (
                  <p className="text-center text-xs py-4" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>— FIM DO FEED —</p>
                )}
              </>
            )}

            {abaAtiva === "noticias" && (
              <>
                {noticias.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center" style={{ background: "#161B22" }}>
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: "#5CC800" }} />
                    <p className="text-sm" style={{ color: "#8B949E" }}>Buscando notícias...</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {noticias.map((n, i) => <CardNoticia key={i} noticia={n} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* FAB mobile */}
        {user && (
          <button onClick={() => setModalAberto(true)}
            className="fixed bottom-6 right-6 flex items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 sm:hidden"
            style={{ width: 56, height: 56, background: "linear-gradient(135deg, #5CC800, #4aaa00)", boxShadow: "0 8px 32px rgba(92,200,0,0.4)" }}>
            <Plus size={24} strokeWidth={2.5} style={{ color: "#fff" }} />
          </button>
        )}

        {/* Banner login (não logado) */}
        {!user && (
          <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, #0D1117, transparent)" }}>
            <div className="mx-auto max-w-md rounded-2xl p-4 text-center" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <p className="font-black mb-2" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                FAÇA LOGIN PARA PARTICIPAR
              </p>
              <a href="/login" className="inline-flex rounded-xl px-6 py-2.5 font-black text-sm"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                ENTRAR
              </a>
            </div>
          </div>
        )}
      </main>

      {modalAberto && <ModalCriarPost onClose={() => setModalAberto(false)} onPublicado={novoPost} />}
    </>
  );
}
