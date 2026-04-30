"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Send, ArrowLeft, X, Search, Loader2 } from "lucide-react";

type Msg = {
  id: number; remetente_id: string; destinatario_id: string;
  texto: string; lida: boolean; created_at: string;
};

type Conversa = {
  outro_id: string; outro_nome: string; outro_avatar: string | null;
  ultima_msg: string; created_at: string; nao_lidas: number;
};

type UserInfo = { id: string; nome: string | null; avatar: string | null; email: string | null };

function tempoRelativo(data: string) {
  const diff = Date.now() - new Date(data).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function ChatPage(): React.JSX.Element {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);
  const [outroUser, setOutroUser] = useState<UserInfo | null>(null);
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<UserInfo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const timerBusca = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return;
      setUser({ id: u.id, email: u.email });
      if (u.email) {
        supabase.from("admins").select("email").eq("email", u.email.toLowerCase()).single()
          .then(({ data }) => setIsAdmin(!!data));
      }
    });
  }, []); // eslint-disable-line

  // Carregar conversas
  const carregarConversas = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/mensagens", { credentials: "include" });
    const data = await res.json();

    // Para cada conversa, buscar info do outro usuário
    const convs: Conversa[] = [];
    for (const m of data.conversas || []) {
      const outro_id = m.remetente_id === user.id ? m.destinatario_id : m.remetente_id;
      const { data: posts } = await supabase.from("feed_posts").select("autor_nome, autor_avatar, autor_email")
        .eq("user_id", outro_id).limit(1).single();
      convs.push({
        outro_id,
        outro_nome: posts?.autor_nome || posts?.autor_email?.split("@")[0] || "Corredor",
        outro_avatar: posts?.autor_avatar || null,
        ultima_msg: m.texto,
        created_at: m.created_at,
        nao_lidas: m.destinatario_id === user.id && !m.lida ? 1 : 0,
      });
    }
    setConversas(convs);
    setCarregando(false);
  }, [user]); // eslint-disable-line

  useEffect(() => { if (user) carregarConversas(); }, [user, carregarConversas]);

  // Abrir conversa
  async function abrirConversa(outro_id: string, info?: UserInfo) {
    setConversaAtiva(outro_id);
    if (info) setOutroUser(info);
    else {
      const { data } = await supabase.from("feed_posts").select("autor_nome, autor_avatar, autor_email, user_id")
        .eq("user_id", outro_id).limit(1).single();
      setOutroUser({ id: outro_id, nome: data?.autor_nome || null, avatar: data?.autor_avatar || null, email: data?.autor_email || null });
    }
    const res = await fetch(`/api/mensagens?outro_id=${outro_id}`, { credentials: "include" });
    const data = await res.json();
    setMensagens(data.mensagens || []);

    // Realtime
    const channel = supabase.channel(`chat-${outro_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, (payload) => {
        const m = payload.new as Msg;
        if ((m.remetente_id === outro_id && m.destinatario_id === user?.id) ||
            (m.remetente_id === user?.id && m.destinatario_id === outro_id)) {
          setMensagens(prev => [...prev, m]);
        }
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar() {
    if (!texto.trim() || enviando || !conversaAtiva || !user) return;
    setEnviando(true);
    const textoEnviar = texto.trim();
    setTexto("");
    const res = await fetch("/api/mensagens", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ destinatario_id: conversaAtiva, texto: textoEnviar }),
    });
    const data = await res.json();
    if (data.success) {
      setMensagens(prev => [...prev, data.mensagem]);
    }
    setEnviando(false);
  }

  function buscarUsuarios(termo: string) {
    setBusca(termo);
    if (timerBusca.current) clearTimeout(timerBusca.current);
    if (termo.length < 2) { setResultadosBusca([]); return; }
    timerBusca.current = setTimeout(async () => {
      setBuscando(true);
      const res = await fetch(`/api/usuarios?q=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setResultadosBusca((data.usuarios || []).map((u: { user_id: string; autor_nome: string | null; autor_avatar: string | null; autor_email: string | null }) => ({
        id: u.user_id, nome: u.autor_nome, avatar: u.autor_avatar, email: u.autor_email,
      })));
      setBuscando(false);
    }, 400);
  }

  const nomeExib = (u: UserInfo | null) => u?.nome || u?.email?.split("@")[0] || "Corredor";

  if (!user) return (
    <>
      <Header userEmail={undefined} isAdmin={false} />
      <main className="flex items-center justify-center min-h-screen" style={{ background: "#0D1117" }}>
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-black text-xl mb-4" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>FAÇA LOGIN PARA USAR O CHAT</p>
          <Link href="/login" className="rounded-xl px-6 py-3 font-black text-sm"
            style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
            ENTRAR
          </Link>
        </div>
      </main>
    </>
  );

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>
        <div className="mx-auto max-w-4xl" style={{ height: "calc(100vh - 64px)", display: "flex" }}>

          {/* Sidebar - Lista de conversas */}
          <div className={`flex flex-col border-r ${conversaAtiva ? "hidden sm:flex" : "flex"}`}
            style={{ width: "100%", maxWidth: 320, borderColor: "rgba(255,255,255,0.06)", background: "#0D1117" }}>
            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-black text-xl mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>💬 MENSAGENS</h2>
              {/* Busca de usuários */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.15)" }}>
                  <Search size={14} style={{ color: "#8B949E" }} />
                  <input value={busca} onChange={e => buscarUsuarios(e.target.value)}
                    placeholder="Buscar corredor..."
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{ color: "#E6EDF3" }} />
                  {buscando && <Loader2 size={12} className="animate-spin" style={{ color: "#5CC800" }} />}
                  {busca && <button onClick={() => { setBusca(""); setResultadosBusca([]); }}><X size={12} style={{ color: "#8B949E" }} /></button>}
                </div>
                {resultadosBusca.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
                    {resultadosBusca.filter(u => u.id !== user.id).map(u => (
                      <button key={u.id} onClick={() => { abrirConversa(u.id, u); setBusca(""); setResultadosBusca([]); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-500/5 transition-colors">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="rounded-full object-cover shrink-0" style={{ width: 36, height: 36 }} />
                        ) : (
                          <div className="rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                            style={{ width: 36, height: 36, background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {(u.nome || u.email || "?")[0]?.toUpperCase()}
                          </div>
                        )}
                        <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{nomeExib(u)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de conversas */}
            <div className="flex-1 overflow-y-auto">
              {carregando ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: "#5CC800" }} /></div>
              ) : conversas.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="font-black text-sm mb-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUMA CONVERSA</p>
                  <p className="text-xs" style={{ color: "#8B949E" }}>Busque um corredor para começar</p>
                </div>
              ) : (
                conversas.map(c => (
                  <button key={c.outro_id} onClick={() => abrirConversa(c.outro_id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ background: conversaAtiva === c.outro_id ? "rgba(92,200,0,0.08)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {c.outro_avatar ? (
                      <img src={c.outro_avatar} alt="" className="rounded-full object-cover shrink-0" style={{ width: 44, height: 44 }} />
                    ) : (
                      <div className="rounded-full flex items-center justify-center shrink-0 font-black"
                        style={{ width: 44, height: 44, background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {c.outro_nome[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-sm truncate" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.outro_nome}</p>
                        <p className="text-xs shrink-0 ml-2" style={{ color: "#8B949E" }}>{tempoRelativo(c.created_at)}</p>
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: "#8B949E" }}>{c.ultima_msg}</p>
                    </div>
                    {c.nao_lidas > 0 && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black"
                        style={{ background: "#5CC800", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {c.nao_lidas}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Área de chat */}
          {conversaAtiva ? (
            <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
              {/* Header do chat */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#161B22", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => setConversaAtiva(null)} className="sm:hidden rounded-lg p-1" style={{ color: "#8B949E" }}>
                  <ArrowLeft size={20} strokeWidth={2} />
                </button>
                {outroUser?.avatar ? (
                  <img src={outroUser.avatar} alt="" className="rounded-full object-cover" style={{ width: 40, height: 40 }} />
                ) : (
                  <div className="rounded-full flex items-center justify-center font-black"
                    style={{ width: 40, height: 40, background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {nomeExib(outroUser)[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{nomeExib(outroUser)}</p>
                  <Link href={`/perfil/${conversaAtiva}`} className="text-xs" style={{ color: "#5CC800" }}>Ver perfil →</Link>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {mensagens.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-4xl mb-2">👋</p>
                      <p className="text-sm" style={{ color: "#8B949E" }}>Comece a conversa!</p>
                    </div>
                  </div>
                )}
                {mensagens.map(m => {
                  const minha = m.remetente_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-xs rounded-2xl px-4 py-2.5"
                        style={{
                          background: minha ? "linear-gradient(135deg, #5CC800, #4aaa00)" : "#161B22",
                          border: minha ? "none" : "1px solid rgba(255,255,255,0.06)",
                          borderBottomRightRadius: minha ? 4 : 16,
                          borderBottomLeftRadius: minha ? 16 : 4,
                        }}>
                        <p className="text-sm" style={{ color: minha ? "#fff" : "#E6EDF3" }}>{m.texto}</p>
                        <p className="text-xs mt-0.5" style={{ color: minha ? "rgba(255,255,255,0.6)" : "#8B949E" }}>{tempoRelativo(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={fimRef} />
              </div>

              {/* Input */}
              <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0D1117" }}>
                <div className="flex gap-2">
                  <input value={texto} onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3" }} />
                  <button onClick={enviar} disabled={!texto.trim() || enviando}
                    className="flex items-center justify-center rounded-xl px-4 transition-all disabled:opacity-40 hover:brightness-110"
                    style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff" }}>
                    {enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center" style={{ background: "#0D1117" }}>
              <div className="text-center">
                <p className="text-6xl mb-3">💬</p>
                <p className="font-black text-xl" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>SELECIONE UMA CONVERSA</p>
                <p className="text-sm mt-1" style={{ color: "#8B949E" }}>ou busque um corredor para começar</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
