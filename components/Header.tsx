"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Header({ userEmail, isAdmin = false }: { userEmail?: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [logoError, setLogoError] = useState(false);

  function isActive(path: string) { return pathname === path || (path !== "/" && pathname.startsWith(path)); }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/", label: "Início", icon: "🏠" },
    { href: "/eventos", label: "Eventos", icon: "🏁" },
    { href: "/encontros", label: "Treinos", icon: "⚡" },
    { href: "/loja", label: "Loja", icon: "🛒" },
    { href: "/meus-treinos", label: "Meus Treinos", icon: "📋" },
    { href: "/perfil", label: "Perfil", icon: "👤" },
  ];
  const adminLinks = [{ href: "/admin", label: "Admin", icon: "⚙️" }];

  const LogoComponent = () => (
    <Link href="/" className="flex items-center group" onClick={() => setMenuAberto(false)}>
      {!logoError ? (
        <img
          src="/logo-moda-run.png"
          alt="Moda Run"
          style={{ height: "42px", width: "auto", objectFit: "contain", maxWidth: "180px" }}
          onError={() => setLogoError(true)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-sm"
            style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
            MR
          </div>
          <div className="hidden sm:block">
            <p className="font-black text-sm leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800", letterSpacing: "0.05em" }}>
              MODA <span style={{ color: "#FF6B00" }}>RUN</span>
            </p>
            <p className="text-xs leading-none mt-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.15em", fontSize: "9px" }}>
              RUNNING & PERFORMANCE
            </p>
          </div>
        </div>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50" style={{ background: "rgba(13,17,23,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(92,200,0,0.15)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <LogoComponent />

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200"
              style={{
                color: isActive(link.href) ? "#5CC800" : "#8B949E",
                background: isActive(link.href) ? "rgba(92,200,0,0.1)" : "transparent",
                borderBottom: isActive(link.href) ? "2px solid #5CC800" : "2px solid transparent",
                fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", fontSize: "13px",
              }}>
              <span>{link.icon}</span><span>{link.label.toUpperCase()}</span>
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

        {/* Ações */}
        <div className="flex items-center gap-2">
          {userEmail ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-lg px-3 py-1.5 text-xs truncate max-w-[140px]"
                style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)" }}>
                {userEmail}
              </span>
              <button onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:scale-105"
                style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                SAIR
              </button>
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

          <button onClick={() => setMenuAberto(!menuAberto)}
            className="flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
            style={{ background: menuAberto ? "rgba(92,200,0,0.2)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(92,200,0,0.2)", color: "#5CC800" }}>
            {menuAberto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuAberto && (
        <div className="lg:hidden px-4 pb-4" style={{ background: "rgba(13,17,23,0.99)", borderTop: "1px solid rgba(92,200,0,0.1)" }}>
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuAberto(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all"
                style={{ color: isActive(link.href) ? "#5CC800" : "#8B949E", background: isActive(link.href) ? "rgba(92,200,0,0.1)" : "transparent", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                <span className="text-lg">{link.icon}</span>{link.label.toUpperCase()}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuAberto(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold"
                style={{ color: "#FF6B00", background: "rgba(255,107,0,0.1)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                ⚙️ ADMIN
              </Link>
            )}
          </nav>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {userEmail ? (
              <div className="space-y-2">
                <p className="px-1 text-xs truncate" style={{ color: "#5CC800" }}>{userEmail}</p>
                <button onClick={handleLogout}
                  className="w-full rounded-xl py-3 text-sm font-bold"
                  style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  SAIR DA CONTA
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMenuAberto(false)}
                  className="rounded-xl py-3 text-center text-sm font-bold"
                  style={{ border: "1px solid rgba(92,200,0,0.4)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                  ENTRAR
                </Link>
                <Link href="/cadastro" onClick={() => setMenuAberto(false)}
                  className="rounded-xl py-3 text-center text-sm font-bold"
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
