"use client";

import Link from "next/link";

export default function Header({ userEmail }: { userEmail?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-white shadow-md">
            MR
          </div>

          <div>
            <p className="text-base font-bold text-slate-900">Moda Run</p>
            <p className="text-xs text-slate-500">Corrida, encontros e estilo</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-orange-600"
          >
            Início
          </Link>
          <Link
            href="/eventos"
            className="text-sm font-medium text-slate-600 transition hover:text-orange-600"
          >
            Eventos
          </Link>
          <Link
            href="/encontros"
            className="text-sm font-medium text-slate-600 transition hover:text-orange-600"
          >
            🏃 Encontros
          </Link>
          <Link
            href="/loja"
            className="text-sm font-medium text-slate-600 transition hover:text-orange-600"
          >
            🛍 Loja
          </Link>
          <Link
            href="/meus-encontros"
            className="text-sm font-medium text-slate-600 transition hover:text-orange-600"
          >
            Meus encontros
          </Link>
        </nav>

        <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm sm:block">
          {userEmail || "Visitante"}
        </div>
      </div>
    </header>
  );
}