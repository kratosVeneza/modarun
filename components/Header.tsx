"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function isActive(path: string) {
    return pathname === path;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-label="Voltar"
          >
            ←
          </button>

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-white shadow-md">
              MR
            </div>

            <div>
              <p className="text-base font-bold text-slate-900">Moda Run</p>
              <p className="text-xs text-slate-500">Corrida, treinos e estilo</p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-5 md:flex">
          <Link
            href="/"
            className={`text-sm font-medium transition ${
              isActive("/")
                ? "text-orange-600"
                : "text-slate-600 hover:text-orange-600"
            }`}
          >
            Início
          </Link>

          <Link
            href="/eventos"
            className={`text-sm font-medium transition ${
              isActive("/eventos")
                ? "text-orange-600"
                : "text-slate-600 hover:text-orange-600"
            }`}
          >
            Eventos
          </Link>

          <Link
            href="/encontros"
            className={`text-sm font-medium transition ${
              isActive("/encontros")
                ? "text-orange-600"
                : "text-slate-600 hover:text-orange-600"
            }`}
          >
            🏃 Treinos
          </Link>

          <Link
            href="/loja"
            className={`text-sm font-medium transition ${
              isActive("/loja")
                ? "text-orange-600"
                : "text-slate-600 hover:text-orange-600"
            }`}
          >
            🛍 Loja
          </Link>

          <Link
            href="/meus-encontros"
            className={`text-sm font-medium transition ${
              isActive("/meus-encontros")
                ? "text-orange-600"
                : "text-slate-600 hover:text-orange-600"
            }`}
          >
            Meus treinos
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm sm:block">
              {userEmail}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Entrar
              </Link>

              <Link
                href="/cadastro"
                className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}