import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Moda Run App</h1>
            <p className="mt-3 text-slate-600">
              Encontre corridas, participe de encontros e acesse os produtos da Moda Run.
            </p>
          </div>

          <div>
            {user ? (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm text-slate-600">{user.email}</p>
                <LogoutButton />
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-5">
          <Link href="/eventos" className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
            Eventos
          </Link>
          <Link href="/encontros" className="rounded-2xl bg-orange-500 px-4 py-3 text-white">
            Encontros
          </Link>
          <Link href="/meus-encontros" className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
  Meus encontros
</Link>
          <Link href="/loja" className="rounded-2xl bg-emerald-600 px-4 py-3 text-white">
            Loja
          </Link>
          <Link href="/admin" className="rounded-2xl bg-slate-700 px-4 py-3 text-white">
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}