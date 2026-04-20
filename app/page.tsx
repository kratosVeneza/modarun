import Link from "next/link";
import Header from "@/components/Header";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header userEmail={user?.email} />

      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl sm:p-12">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-orange-200">
                Moda Run App
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
                Corra na moda. Encontre sua comunidade. Compre melhor.
              </h1>

              <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
                Descubra encontros de corrida, participe com outras pessoas,
                acompanhe oportunidades e encontre os produtos ideais para cada
                treino.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/encontros"
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600"
                >
                  Explorar encontros
                </Link>

                <Link
                  href="/loja"
                  className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver loja
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <CardStat titulo="Comunidade" valor="Encontros locais" />
            <CardStat titulo="Moda Run" valor="Loja integrada" />
            <CardStat titulo="Treinos" valor="Participação em grupo" />
            <CardStat titulo="Conta" valor={user ? "Logado" : "Visitante"} />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HomeCard
              titulo="Eventos"
              descricao="Veja corridas e oportunidades para participar."
              href="/eventos"
              cta="Abrir eventos"
            />
            <HomeCard
              titulo="Encontros"
              descricao="Encontre grupos e treinos na sua cidade."
              href="/encontros"
              cta="Abrir encontros"
            />
            <HomeCard
              titulo="Loja"
              descricao="Produtos para treino, prova e estilo."
              href="/loja"
              cta="Abrir loja"
            />
            <HomeCard
              titulo="Meus encontros"
              descricao="Gerencie os encontros que você criou."
              href="/meus-encontros"
              cta="Ver meus encontros"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Moda Run
              </span>

              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Corra com mais motivação
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Organize seus treinos, encontre pessoas para correr e transforme
                cada encontro em uma experiência completa.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/encontros"
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Criar ou participar
                </Link>

                <Link
                  href="/loja"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ver produtos
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Sua conta</h2>

              <p className="mt-2 text-sm text-slate-500">
                {user
                  ? `Você está logado como ${user.email}`
                  : "Entre ou crie sua conta para organizar e participar de encontros."}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {user ? (
                  <>
                    <Link
                      href="/meus-encontros"
                      className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      Meus encontros
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/cadastro"
                      className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      Criar conta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function CardStat({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 text-lg font-bold text-slate-900">{valor}</p>
    </div>
  );
}

function HomeCard({
  titulo,
  descricao,
  href,
  cta,
}: {
  titulo: string;
  descricao: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="card-hover group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg"
    >
      <h3 className="text-xl font-bold text-slate-900">{titulo}</h3>
      <p className="mt-2 text-sm text-slate-500">{descricao}</p>
      <p className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:translate-x-1">
        {cta} →
      </p>
    </Link>
  );
}