"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, CheckCheck, Loader2, Search, Send, Trash2, UserRound, X } from "lucide-react";

type UserAuth = {
  id: string;
  email?: string | null;
};

type Mensagem = {
  id: number;
  remetente_id: string;
  destinatario_id: string;
  texto: string | null;
  lida: boolean | null;
  created_at: string;
  lida_em?: string | null;
  apagada_para_todos?: boolean | null;
};

type Conversa = {
  outro_id: string;
  outro_nome: string;
  outro_avatar: string | null;
  outro_email?: string | null;
  ultima_msg: string;
  created_at: string;
  nao_lidas: number;
  remetente_id: string;
  destinatario_id: string;
};

type UsuarioBusca = {
  user_id: string;
  autor_nome: string | null;
  autor_avatar: string | null;
  autor_email: string | null;
};

function tempoRelativo(data: string) {
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

function horario(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const fimRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<UserAuth | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregandoConversas, setCarregandoConversas] = useState(false);
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
  const [buscando, setBuscando] = useState(false);

  const conversaAtivaRef = useRef<Conversa | null>(null);
  const abriuParametroInicialRef = useRef(false);
  const recarregarConversasTimerRef = useRef<number | null>(null);

  const userIdInicial = searchParams.get("user") || searchParams.get("mensagem") || "";

  const carregarConversas = useCallback(async () => {
    setCarregandoConversas(true);
    const res = await fetch("/api/mensagens", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setConversas(data.conversas || []);
    setCarregandoConversas(false);
  }, []);

  const abrirConversa = useCallback(async (outroId: string, parcial?: Partial<Conversa>) => {
    if (!outroId || outroId === user?.id) return;
    setErro("");
    setCarregandoMensagens(true);

    const res = await fetch(`/api/mensagens?outro_id=${outroId}`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      setErro(data.error || "Não foi possível abrir a conversa.");
      setCarregandoMensagens(false);
      return;
    }

    const conversaExistente = conversas.find((c) => c.outro_id === outroId);
    const outro = data.outro;

    setConversaAtiva(conversaExistente || {
      outro_id: outroId,
      outro_nome: parcial?.outro_nome || outro?.nome || "Corredor",
      outro_avatar: parcial?.outro_avatar ?? outro?.avatar ?? null,
      outro_email: parcial?.outro_email || outro?.email || null,
      ultima_msg: "",
      created_at: new Date().toISOString(),
      nao_lidas: 0,
      remetente_id: user?.id || "",
      destinatario_id: outroId,
    });

    setMensagens(data.mensagens || []);
    setCarregandoMensagens(false);
    carregarConversas();
  }, [carregarConversas, conversas, user?.id]);

  useEffect(() => {
    async function iniciar() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }

      setUser({ id: authUser.id, email: authUser.email });

      const { data: adminRow } = await supabase
        .from("admins")
        .select("email")
        .eq("email", authUser.email?.toLowerCase() || "")
        .maybeSingle();
      setIsAdmin(!!adminRow);
      setCarregandoAuth(false);
      await carregarConversas();
    }

    iniciar();
  }, [carregarConversas, router, supabase]);

  useEffect(() => {
    conversaAtivaRef.current = conversaAtiva;
  }, [conversaAtiva]);

  useEffect(() => {
    if (!user || !userIdInicial || abriuParametroInicialRef.current) return;
    abriuParametroInicialRef.current = true;
    abrirConversa(userIdInicial);
  }, [abrirConversa, user, userIdInicial]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  useEffect(() => {
    if (!user) return;

    function atualizarListaConversasComDebounce() {
      if (recarregarConversasTimerRef.current) {
        window.clearTimeout(recarregarConversasTimerRef.current);
      }

      recarregarConversasTimerRef.current = window.setTimeout(() => {
        carregarConversas();
      }, 300);
    }

    const canal = supabase
      .channel(`mensagens-usuario-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, (payload) => {
        const nova = payload.new as Mensagem;
        const pertence = nova.remetente_id === user.id || nova.destinatario_id === user.id;
        if (!pertence) return;

        const outroId = nova.remetente_id === user.id ? nova.destinatario_id : nova.remetente_id;
        const conversaAberta = conversaAtivaRef.current?.outro_id === outroId;

        if (conversaAberta) {
          setMensagens((prev) => prev.some((m) => m.id === nova.id) ? prev : [...prev, nova]);

          if (nova.destinatario_id === user.id) {
            fetch("/api/mensagens", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ acao: "marcar_lidas", outro_id: outroId }),
            }).catch(() => undefined);
          }
        }

        atualizarListaConversasComDebounce();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensagens" }, (payload) => {
        const atualizada = payload.new as Mensagem;
        const pertence = atualizada.remetente_id === user.id || atualizada.destinatario_id === user.id;
        if (!pertence) return;

        const outroId = atualizada.remetente_id === user.id ? atualizada.destinatario_id : atualizada.remetente_id;
        if (conversaAtivaRef.current?.outro_id === outroId) {
          setMensagens((prev) => prev.map((m) => m.id === atualizada.id ? { ...m, ...atualizada } : m));
        }

        atualizarListaConversasComDebounce();
      })
      .subscribe();

    return () => {
      if (recarregarConversasTimerRef.current) window.clearTimeout(recarregarConversasTimerRef.current);
      supabase.removeChannel(canal);
    };
  }, [carregarConversas, supabase, user]);

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) {
      setResultados([]);
      return;
    }

    let cancelado = false;
    setBuscando(true);

    const timer = window.setTimeout(async () => {
      const res = await fetch(`/api/usuarios?q=${encodeURIComponent(termo)}`, { credentials: "include" });
      const data = await res.json();
      if (!cancelado) {
        setResultados((data.usuarios || []).filter((u: UsuarioBusca) => u.user_id !== user?.id));
        setBuscando(false);
      }
    }, 350);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [busca, user?.id]);

  async function enviarMensagem() {
    if (!conversaAtiva || !texto.trim() || enviando) return;

    const conteudo = texto.trim();
    setTexto("");
    setEnviando(true);
    setErro("");

    const res = await fetch("/api/mensagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ destinatario_id: conversaAtiva.outro_id, texto: conteudo }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErro(data.error || "Erro ao enviar mensagem.");
      setTexto(conteudo);
    } else {
      setMensagens((prev) => prev.some((m) => m.id === data.mensagem.id) ? prev : [...prev, data.mensagem]);
      carregarConversas();
    }

    setEnviando(false);
  }

  async function apagarMensagem(id: number, modo: "para_mim" | "todos") {
    const res = await fetch(`/api/mensagens?id=${id}&modo=${modo}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao apagar mensagem.");
      return;
    }

    if (modo === "para_mim") {
      setMensagens((prev) => prev.filter((m) => m.id !== id));
    } else {
      setMensagens((prev) => prev.map((m) => m.id === id ? { ...m, texto: "Mensagem apagada", apagada_para_todos: true } : m));
    }

    carregarConversas();
  }

  function iniciarConversaComUsuario(u: UsuarioBusca) {
    setBusca("");
    setResultados([]);
    abrirConversa(u.user_id, {
      outro_nome: u.autor_nome || "Corredor",
      outro_avatar: u.autor_avatar || null,
      outro_email: u.autor_email || null,
    });
  }

  if (carregandoAuth) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center" style={{ background: "#0D1117" }}>
          <Loader2 className="animate-spin" size={34} style={{ color: "#5CC800" }} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header userEmail={user?.email || undefined} isAdmin={isAdmin} />
      <main className="min-h-screen px-4 py-6" style={{ background: "linear-gradient(180deg,#0D1117 0%,#101820 100%)" }}>
        <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl" style={{ border: "1px solid rgba(92,200,0,0.18)", background: "rgba(13,17,23,0.92)", boxShadow: "0 20px 80px rgba(0,0,0,0.35)" }}>
          <div className="p-4 lg:p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(135deg, rgba(92,200,0,0.08), rgba(255,107,0,0.04))" }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>MENSAGENS PRIVADAS</h1>
                <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>Pesquise usuários cadastrados no app, chame para conversar e continue suas conversas privadas.</p>
              </div>
              <div className="relative w-full lg:max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5CC800" }} />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar usuários por nome ou e-mail..."
                  className="w-full rounded-2xl py-3 pl-10 pr-10 text-sm font-semibold outline-none"
                  style={{ background: "#0D1117", color: "#E6EDF3", border: "1px solid rgba(92,200,0,0.28)" }}
                />
                {busca && (
                  <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8B949E" }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="grid min-h-[calc(100vh-240px)] lg:grid-cols-[360px_1fr]">
            <aside className={`${conversaAtiva ? "hidden lg:block" : "block"}`} style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "#10161D" }}>
              <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h1 className="text-2xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>MENSAGENS</h1>
                <p className="text-sm mt-1" style={{ color: "#8B949E" }}>Conversas recentes e busca de usuários.</p>

                <div className="relative mt-4">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8B949E" }} />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Pesquisar usuários..."
                    className="w-full rounded-2xl py-3 pl-10 pr-10 text-sm outline-none"
                    style={{ background: "#21262D", color: "#E6EDF3", border: "1px solid rgba(92,200,0,0.16)" }}
                  />
                  {busca && (
                    <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8B949E" }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {busca.trim().length >= 2 ? (
                <div className="p-2">
                  {buscando && <p className="p-4 text-sm" style={{ color: "#8B949E" }}>Buscando...</p>}
                  {!buscando && resultados.length === 0 && <p className="p-4 text-sm" style={{ color: "#8B949E" }}>Nenhum corredor encontrado.</p>}
                  {resultados.map((u) => (
                    <button key={u.user_id} onClick={() => iniciarConversaComUsuario(u)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-white/5">
                      {u.autor_avatar ? <img src={u.autor_avatar} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg,#5CC800,#FF6B00)", color: "#fff" }}><UserRound size={18} /></div>}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{u.autor_nome || "Corredor"}</p>
                        <p className="truncate text-xs" style={{ color: "#8B949E" }}>{u.autor_email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-2">
                  {carregandoConversas && <div className="p-8 text-center"><Loader2 className="mx-auto animate-spin" style={{ color: "#5CC800" }} /></div>}
                  {!carregandoConversas && conversas.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-4xl">💬</p>
                      <p className="mt-2 text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUMA CONVERSA</p>
                      <p className="mt-1 text-xs" style={{ color: "#8B949E" }}>Use a barra de pesquisa acima para encontrar usuários cadastrados.</p>
                    </div>
                  )}
                  {conversas.map((c) => {
                    const ativa = conversaAtiva?.outro_id === c.outro_id;
                    return (
                      <button key={c.outro_id} onClick={() => abrirConversa(c.outro_id, c)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-white/5" style={{ background: ativa ? "rgba(92,200,0,0.08)" : "transparent" }}>
                        {c.outro_avatar ? <img src={c.outro_avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black" style={{ background: "linear-gradient(135deg,#5CC800,#FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.outro_nome[0]?.toUpperCase() || "C"}</div>}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{c.outro_nome}</p>
                            {c.nao_lidas > 0 && <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: "#5CC800", color: "#fff" }}>{c.nao_lidas}</span>}
                          </div>
                          <p className="mt-0.5 truncate text-xs" style={{ color: c.nao_lidas > 0 ? "#E6EDF3" : "#8B949E" }}>{c.ultima_msg}</p>
                        </div>
                        <span className="shrink-0 text-[11px]" style={{ color: "#8B949E" }}>{tempoRelativo(c.created_at)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            <section className={`${conversaAtiva ? "flex" : "hidden lg:flex"} min-h-[calc(100vh-150px)] flex-col`}>
              {!conversaAtiva ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: "rgba(92,200,0,0.08)", color: "#5CC800" }}>
                    <Send size={34} />
                  </div>
                  <h2 className="text-2xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>Selecione uma conversa</h2>
                  <p className="mt-2 max-w-sm text-sm" style={{ color: "#8B949E" }}>Use a busca para chamar outro corredor ou continue uma conversa existente.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#161B22" }}>
                    <button onClick={() => setConversaAtiva(null)} className="rounded-xl p-2 lg:hidden" style={{ color: "#8B949E", background: "#21262D" }}>
                      <ArrowLeft size={18} />
                    </button>
                    {conversaAtiva.outro_avatar ? <img src={conversaAtiva.outro_avatar} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full font-black" style={{ background: "linear-gradient(135deg,#5CC800,#FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>{conversaAtiva.outro_nome[0]?.toUpperCase() || "C"}</div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{conversaAtiva.outro_nome}</p>
                      <p className="truncate text-xs" style={{ color: "#8B949E" }}>{conversaAtiva.outro_email || "Conversa privada"}</p>
                    </div>
                  </div>

                  {erro && <div className="mx-4 mt-4 rounded-2xl p-3 text-sm" style={{ background: "rgba(255,107,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,107,0,0.25)" }}>{erro}</div>}

                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {carregandoMensagens && <div className="p-8 text-center"><Loader2 className="mx-auto animate-spin" style={{ color: "#5CC800" }} /></div>}
                    {!carregandoMensagens && mensagens.length === 0 && (
                      <div className="py-12 text-center">
                        <p className="text-3xl">👋</p>
                        <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>Envie a primeira mensagem.</p>
                      </div>
                    )}
                    {mensagens.map((m) => {
                      const minha = m.remetente_id === user?.id;
                      const apagada = !!m.apagada_para_todos;
                      return (
                        <div key={m.id} className={`group flex ${minha ? "justify-end" : "justify-start"}`}>
                          <div className="flex max-w-[82%] items-end gap-2">
                            {minha && !apagada && (
                              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                <button title="Apagar só para mim" onClick={() => apagarMensagem(m.id, "para_mim")} className="rounded-lg p-1" style={{ color: "#8B949E" }}><X size={14} /></button>
                                <button title="Apagar para todos" onClick={() => apagarMensagem(m.id, "todos")} className="rounded-lg p-1" style={{ color: "#FF6B00" }}><Trash2 size={14} /></button>
                              </div>
                            )}
                            {!minha && !apagada && (
                              <button title="Apagar só para mim" onClick={() => apagarMensagem(m.id, "para_mim")} className="rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "#8B949E" }}><X size={14} /></button>
                            )}
                            <div className="rounded-2xl px-4 py-2" style={{ background: minha ? "linear-gradient(135deg,#5CC800,#4aaa00)" : "#21262D", borderBottomRightRadius: minha ? 5 : 18, borderBottomLeftRadius: minha ? 18 : 5, opacity: apagada ? 0.7 : 1 }}>
                              <p className="whitespace-pre-wrap break-words text-sm italic" style={{ color: minha ? "#fff" : "#E6EDF3", fontStyle: apagada ? "italic" : "normal" }}>{m.texto || ""}</p>
                              <div className={`mt-1 flex items-center gap-1 ${minha ? "justify-end" : "justify-start"}`}>
                                <span className="text-[10px]" style={{ color: minha ? "rgba(255,255,255,0.7)" : "#8B949E" }}>{horario(m.created_at)}</span>
                                {minha && <CheckCheck size={12} style={{ color: m.lida ? "#E6EDF3" : "rgba(255,255,255,0.55)" }} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={fimRef} />
                  </div>

                  <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#10161D" }}>
                    <div className="flex gap-2">
                      <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value.slice(0, 1200))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            enviarMensagem();
                          }
                        }}
                        rows={1}
                        placeholder="Digite uma mensagem..."
                        className="max-h-32 flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                        style={{ background: "#21262D", color: "#E6EDF3", border: "1px solid rgba(92,200,0,0.16)" }}
                      />
                      <button onClick={enviarMensagem} disabled={!texto.trim() || enviando} className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all disabled:opacity-40" style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff" }}>
                        {enviando ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      </button>
                    </div>
                    <p className="mt-2 text-right text-[11px]" style={{ color: "#8B949E" }}>{texto.length}/1200</p>
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
