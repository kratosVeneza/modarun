"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Header({ userEmail, isAdmin = false }: { userEmail?: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  function isActive(path: string) { return pathname === path; }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/eventos", label: "Eventos" },
    { href: "/encontros", label: "🏃 Treinos" },
    { href: "/loja", label: "🛍 Loja" },
    { href: "/meus-treinos", label: "Meus treinos" },
    { href: "/perfil", label: "Perfil" },
  ];

  const adminLinks = [{ href: "/admin", label: "👑 Admin" }];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-white shadow-md">MR</div>
          <div className="hidden sm:block">
            <p className="text-base font-bold text-slate-900 leading-none">Moda Run</p>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Corrida, treinos e estilo</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${isActive(link.href) ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
              {link.label}
            </Link>
          ))}
          {isAdmin && adminLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${isActive(link.href) ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {userEmail ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 max-w-[160px] truncate">{userEmail}</span>
              <button onClick={handleLogout}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                Sair
              </button>
            </div>
          ) : (
            <div className="hidden gap-2 sm:flex">
              <Link href="/login" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Entrar</Link>
              <Link href="/cadastro" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">Criar conta</Link>
            </div>
          )}
          <button onClick={() => setMenuAberto(!menuAberto)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="Menu">
            {menuAberto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuAberto && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuAberto(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${isActive(link.href) ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50"}`}>
                {link.label}
              </Link>
            ))}
            {isAdmin && adminLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuAberto(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${isActive(link.href) ? "bg-orange-50 text-orange-600" : "text-slate-700 hover:bg-slate-50"}`}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {userEmail ? (
              <div className="space-y-2">
                <p className="px-1 text-xs text-slate-400 truncate">{userEmail}</p>
                <button onClick={handleLogout}
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-100">
                  Sair da conta
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMenuAberto(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">Entrar</Link>
                <Link href="/cadastro" onClick={() => setMenuAberto(false)}
                  className="rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white">Criar conta</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
