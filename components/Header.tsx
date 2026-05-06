"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, X, Check, UserPlus } from "lucide-react";

type Notif = {
  id: number;
  tipo: string;
  titulo: string;
  corpo: string | null;
  lida: boolean;
  created_at: string;
  user_id?: string | null;
  ator_nome: string | null;
  ator_avatar: string | null;
  post_id: number | null;
  link: string | null;
};

type SugestaoPerfil = {
  user_id: string;
  autor_nome: string | null;
  autor_avatar: string | null;
  autor_email: string | null;
};

type NavLink = {
  href: string;
  label: string;
  icon: string;
  badge?: number;
};

export default function Header({ userEmail, isAdmin = false }: { userEmail?: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const painelRef = useRef<HTMLDivElement>(null);

  const [menuAberto, setMenuAberto] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [painelAberto, setPainelAberto] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoPerfil[]>([]);
  const [seguindoSugestao, setSeguindoSugestao] = useState<string | null>(null);

  function isActive(path: string) {
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  }

  function iconeNotif(tipo: string) {
    if (tipo === "novo_seguidor") return "🏃";
    if (tipo === "curtida_post") return "❤️";
    if (tipo === "comentario_post") return "💬";
    if (tipo === "resposta_comentario") return "↩️";
    if (tipo === "mencao_comentario") return "@";
    if (tipo === "curtida_comentario") return "💚";
    if (tipo === "mensagem_privada") return "✉️";
    return "🔔";
  }

  async function carregarResumoMensagens() {
    const res = await fetch("/api/mensagens?resumo=1", { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setMensagensNaoLidas(data.total_nao_lidas || 0);
  }

  async function carregarNotificacoesEMensagens() {
    const [notificacoesRes, mensagensRes] = await Promise.all([
      fetch("/api/notificacoes", { credentials: "include", cache: "no-store" }),
      fetch("/api/mensagens?resumo=1", { credentials: "include", cache: "no-store" }),
    ]);

    const notificacoesData = await notificacoesRes.json().catch(() => ({}));
    const mensagensData = await mensagensRes.json().catch(() => ({}));

    if (notificacoesRes.ok) {
      setNotifs(notificacoesData.notificacoes || []);
      setNaoLidas(notificacoesData.nao_lidas || 0);
    }

    if (mensagensRes.ok) {
      setMensagensNaoLidas(mensagensData.total_nao_lidas || 0);
    }
  }

  useEffect(() => {
    if (!userEmail) return;
    let cancelado = false;

    async function iniciar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelado) return;
      setAuthUserId(user.id);

      const sugestoesRes = await fetch("/api/usuarios?sugestoes=1", { credentials: "include", cache: "no-store" });
      const sugestoesData = await sugestoesRes.json().catch(() => ({}));

      if (cancelado) return;
      await carregarNotificacoesEMensagens();
      if (cancelado) return;
      setSugestoes(sugestoesData.usuarios || []);
    }

    iniciar();

    const intervalo = window.setInterval(() => {
      if (!cancelado) carregarNotificacoesEMensagens().catch(() => undefined);
    }, 12000);

    function handleClick(e: MouseEvent) {
      if (painelRef.current && !painelRef.current.contains(e.target as Node)) setPainelAberto(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [supabase, userEmail]);

  useEffect(() => {
    if (!painelAberto || !userEmail) return;
    carregarNotificacoesEMensagens().catch(() => undefined);
  }, [painelAberto, userEmail]);

  useEffect(() => {
    if (!authUserId) return;

    const notificacoesChannel = supabase.channel(`notificacoes-${authUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificacoes", filter: `user_id=eq.${authUserId}` }, (payload) => {
        const n = payload.new as Notif;
        if (n.user_id && n.user_id !== authUserId) return;
        setNotifs(prev => [n, ...prev].slice(0, 30));
        setNaoLidas(prev => prev + 1);
      })
      .subscribe();

    const mensagensChannel = supabase.channel(`header-mensagens-${authUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens", filter: `destinatario_id=eq.${authUserId}` }, (payload) => {
        const m = payload.new as { destinatario_id?: string; lida?: boolean };
        if (m.destinatario_id !== authUserId) return;
        setMensagensNaoLidas(prev => prev + (m.lida ? 0 : 1));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensagens", filter: `destinatario_id=eq.${authUserId}` }, () => {
        carregarResumoMensagens().catch(() => undefined);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificacoesChannel);
      supabase.removeChannel(mensagensChannel);
    };
  }, [authUserId, supabase]);

  async function marcarTodasLidas() {
    await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: "todas" }),
    });
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
  }

  async function excluirNotif(id: number) {
    await fetch(`/api/notificacoes?id=${id}`, { method: "DELETE", credentials: "include" });
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  async function seguirSugestao(userId: string) {
    setSeguindoSugestao(userId);
    const res = await fetch("/api/feed/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ following_id: userId, acao: "seguir" }),
    });
    if (res.ok) setSugestoes(prev => prev.filter(s => s.user_id !== userId));
    setSeguindoSugestao(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks: NavLink[] = [
    { href: "/",            label: "Comunidade",   icon: "🏃" },
    { href: "/eventos",     label: "Eventos",      icon: "🏁" },
    { href: "/encontros",   label: "Treinos",      icon: "⚡" },
    { href: "/loja",        label: "Loja",         icon: "🛒" },
    { href: "/ferramentas", label: "Ferramentas",  icon: "🛠" },
    { href: "/perfil",      label: "Perfil",       icon: "👤" },
    { href: "/chat",        label: "Chat",         icon: "💬", badge: mensagensNaoLidas },
  ];

  const adminLinks = [{ href: "/admin", label: "Admin", icon: "⚙️" }];

  const LogoComponent = () => (
    <Link href="/" className="flex items-center group" onClick={() => setMenuAberto(false)}>
      {!logoError ? (
        <img
          src="/logo-moda-run.png"
          alt="Moda Run"
          style={{ height: "63px", width: "auto", objectFit: "contain", maxWidth: "220px" }}
          onError={() => setLogoError(true)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-sm"
            style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
            MR
          </div>
          <div className="hidden sm:block">
            <p className="font-black text-sm leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800", letterSpacing: "0.05em" }}>
              MODA <span style={{ color: "#FF6B00" }}>RUN</span>
            </p>
            <p className="text-xs leading-none mt-0.5"
              style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.15em", fontSize: "9px" }}>
              RUNNING & PERFORMANCE
            </p>
          </div>
        </div>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50"
      style={{ background: "rgba(13,17,23,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(92,200,0,0.15)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <LogoComponent />

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200"
              style={{
                color: isActive(link.href) ? (link.href === "/ferramentas" ? "#FFB800" : "#5CC800") : "#8B949E",
                background: isActive(link.href) ? (link.href === "/ferramentas" ? "rgba(255,184,0,0.1)" : "rgba(92,200,0,0.1)") : "transparent",
                borderBottom: isActive(link.href) ? ("2px solid " + (link.href === "/ferramentas" ? "#FFB800" : "#5CC800")) : "2px solid transparent",
                fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", fontSize: "13px",
              }}>
              <span>{link.icon}</span><span>{link.label.toUpperCase()}</span>
              {!!link.badge && link.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black"
                  style={{ background: "#FF6B00", color: "#fff" }}>{link.badge > 9 ? "9+" : link.badge}</span>
              )}
            </Link>
          ))}
          {isAdmin && adminLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all"
              style={{ color: isActive(link.href) ? "#FF6B00" : "#8B949E", background: isActive(link.href) ? "rgba(255,107,0,0.1)" : "transparent", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", fontSize: "13px" }}>
              <span>{link.icon}</span><span>ADMIN</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {userEmail ? (
            <div className="flex items-center gap-2">
              <span className="hidden rounded-lg px-3 py-1.5 text-xs truncate max-w-[140px] sm:inline-block"
                style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)" }}>
                {userEmail}
              </span>
              <button onClick={handleLogout}
                className="hidden rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 sm:inline-flex"
                style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                SAIR
              </button>

              <div className="relative" ref={painelRef}>
                <button onClick={() => { setPainelAberto(v => !v); if (!painelAberto && naoLidas > 0) marcarTodasLidas(); }}
                  className="relative flex items-center justify-center rounded-xl p-2 transition-all hover:scale-105"
                  style={{ background: naoLidas > 0 ? "rgba(92,200,0,0.15)" : "rgba(255,255,255,0.05)", border: naoLidas > 0 ? "1px solid rgba(92,200,0,0.3)" : "1px solid transparent" }}>
                  <Bell size={18} strokeWidth={2} style={{ color: naoLidas > 0 ? "#5CC800" : "#8B949E" }} />
                  {naoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-black"
                      style={{ background: "#FF6B00", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px" }}>
                      {naoLidas > 9 ? "9+" : naoLidas}
                    </span>
                  )}
                </button>

                {painelAberto && (
                  <div className="absolute right-0 top-full mt-2 w-[min(92vw,22rem)] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden shadow-2xl z-50"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>NOTIFICAÇÕES</span>
                      {notifs.some(n => !n.lida) && (
                        <button onClick={marcarTodasLidas} className="flex items-center gap-1 text-xs font-black"
                          style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          <Check size={12} strokeWidth={2} /> MARCAR TODAS
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
                      {notifs.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-2xl mb-1">🔔</p>
                          <p className="text-sm" style={{ color: "#8B949E" }}>Nenhuma notificação ainda</p>
                        </div>
                      ) : (
                        notifs.map(n => (
                          <div key={n.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: n.lida ? "transparent" : "rgba(92,200,0,0.04)" }}>
                            <div className="shrink-0 mt-0.5 text-lg">
                              {n.ator_avatar ? <img src={n.ator_avatar} alt="" className="rounded-full object-cover" style={{ width: 32, height: 32 }} /> : <span>{iconeNotif(n.tipo)}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link href={n.link || (n.post_id ? `/#post-${n.post_id}` : "/chat")} onClick={() => setPainelAberto(false)}
                                className="text-sm leading-tight block hover:underline"
                                style={{ color: n.lida ? "#8B949E" : "#E6EDF3" }}>{n.titulo}</Link>
                              {n.corpo && <p className="text-xs mt-0.5 truncate" style={{ color: "#8B949E" }}>{n.corpo}</p>}
                              <p className="text-xs mt-1" style={{ color: "rgba(139,148,158,0.6)" }}>
                                {new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <button onClick={() => excluirNotif(n.id)} className="shrink-0 rounded-lg p-1 hover:bg-red-500/10" style={{ color: "#8B949E" }}>
                              <X size={12} strokeWidth={2} />
                            </button>
                          </div>
                        ))
                      )}

                      {sugestoes.length > 0 && (
                        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="mb-2 text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>
                            SUGESTÕES PARA SEGUIR
                          </p>
                          <div className="space-y-2">
                            {sugestoes.map(s => (
                              <div key={s.user_id} className="flex items-center gap-2 rounded-xl p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                                {s.autor_avatar ? <img src={s.autor_avatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black" style={{ background: "linear-gradient(135deg,#5CC800,#FF6B00)", color: "#fff" }}>{(s.autor_nome || s.autor_email || "C")[0]}</div>}
                                <Link href={`/perfil/${s.user_id}`} onClick={() => setPainelAberto(false)} className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-black" style={{ color: "#E6EDF3" }}>{s.autor_nome || s.autor_email?.split("@")[0] || "Corredor"}</p>
                                  <p className="truncate text-[11px]" style={{ color: "#8B949E" }}>{s.autor_email}</p>
                                </Link>
                                <button onClick={() => seguirSugestao(s.user_id)} disabled={seguindoSugestao === s.user_id}
                                  className="rounded-lg px-2 py-1 text-[11px] font-black disabled:opacity-50"
                                  style={{ background: "rgba(92,200,0,0.15)", color: "#5CC800" }}>
                                  <UserPlus size={12} className="inline" /> SEGUIR
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden gap-2 sm:flex">
              <Link href="/login" className="rounded-lg px-4 py-2 text-xs font-bold transition-all hover:scale-105"
                style={{ border: "1px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                ENTRAR
              </Link>
              <Link href="/cadastro" className="rounded-lg px-4 py-2 text-xs font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                CRIAR CONTA
              </Link>
            </div>
          )}

          <button onClick={() => setMenuAberto(!menuAberto)} className="flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
            style={{ background: menuAberto ? "rgba(92,200,0,0.2)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(92,200,0,0.2)", color: "#5CC800" }}>
            {menuAberto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuAberto && (
        <div className="lg:hidden px-4 pb-4" style={{ background: "rgba(13,17,23,0.99)", borderTop: "1px solid rgba(92,200,0,0.1)" }}>
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuAberto(false)}
                className="relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all"
                style={{
                  color: isActive(link.href) ? (link.href === "/ferramentas" ? "#FFB800" : "#5CC800") : "#8B949E",
                  background: isActive(link.href) ? (link.href === "/ferramentas" ? "rgba(255,184,0,0.1)" : "rgba(92,200,0,0.1)") : "transparent",
                  fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
                }}>
                <span className="text-lg">{link.icon}</span>{link.label.toUpperCase()}
                {!!link.badge && link.badge > 0 && <span className="ml-auto rounded-full px-2 py-0.5 text-xs" style={{ background: "#FF6B00", color: "#fff" }}>{link.badge > 9 ? "9+" : link.badge}</span>}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold"
                style={{ color: "#FF6B00", background: "rgba(255,107,0,0.1)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                ⚙️ ADMIN
              </Link>
            )}
          </nav>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {userEmail ? (
              <div className="space-y-2">
                <p className="px-1 text-xs truncate" style={{ color: "#5CC800" }}>{userEmail}</p>
                <button onClick={handleLogout} className="w-full rounded-xl py-3 text-sm font-bold"
                  style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  SAIR DA CONTA
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMenuAberto(false)} className="rounded-xl py-3 text-center text-sm font-bold"
                  style={{ border: "1px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  ENTRAR
                </Link>
                <Link href="/cadastro" onClick={() => setMenuAberto(false)} className="rounded-xl py-3 text-center text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  CRIAR CONTA
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
