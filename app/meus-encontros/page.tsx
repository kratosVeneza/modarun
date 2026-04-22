import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/server";
import BotaoExcluirTreinoWrapper from "@/components/BotaoExcluirTreinoWrapper";
import Link from "next/link";

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function MeusEncontrosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-50 px-4 py-12">
          <div className="mx-auto max-w-lg text-center">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">🔒</div>
              <h1 className="text-xl font-bold text-slate-900">Acesso restrito</h1>
              <p className="mt-2 text-sm text-slate-500">Você precisa estar logado para ver seus treinos.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/login" className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Entrar</Link>
                <Link href="/cadastro" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Criar conta</Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Verifica admin pela tabela
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email?.toLowerCase() ?? "")
    .single();
  const isAdmin = !!adminRow;

  // Admin vê todos os treinos, usuário comum vê só os seus
  const query = supabase
    .from("encontros")
    .select("*, encontro_participantes(id)")
    .order("data_encontro", { ascending: true });

  const { data: encontros, error } = isAdmin
    ? await query
    : await query.eq("user_id", user.id);

  return (
    <>
      <Header userEmail={user.email} />

      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Header */}
          <section className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-800 p-7 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-200">
                  {isAdmin ? "👑 Painel Admin" : "Sua conta"}
                </span>
                <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                  {isAdmin ? "Todos os treinos" : "Meus treinos"}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {isAdmin
                    ? `Visão de administrador · ${encontros?.length || 0} treino${(encontros?.length || 0) !== 1 ? "s" : ""} no total`
                    : `Treinos que você organizou · ${encontros?.length || 0} no total`}
                </p>
              </div>
              {isAdmin && (
                <span className="shrink-0 rounded-2xl bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-300">
                  Acesso total
                </span>
              )}
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Erro ao carregar treinos: {error.message}
            </div>
          )}

          {!error && encontros?.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mb-3 text-4xl">🏃</div>
              <p className="font-semibold text-slate-700">Nenhum treino encontrado</p>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin ? "Nenhum treino foi criado ainda." : "Organize seu primeiro treino e convide amigos para correr."}
              </p>
              <Link href="/encontros" className="mt-5 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">
                Criar treino
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {encontros?.map((e) => {
              const participantes = e.encontro_participantes?.length || 0;
              const ehDono = e.user_id === user.id;

              return (
                <div key={e.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{e.titulo}</h2>
                        {e.tipo_treino && (
                          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                            {e.tipo_treino}
                          </span>
                        )}
                        {isAdmin && !ehDono && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                            de outro usuário
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">📍 {e.cidade} - {e.estado}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/treinos/${e.id}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-500 hover:text-white hover:border-orange-500"
                      >
                        Abrir →
                      </Link>
                      <BotaoExcluirTreinoWrapper
                        encontroId={e.id}
                        titulo={e.titulo}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <InfoChip label="Data" value={formatarData(String(e.data_encontro))} />
                    <InfoChip label="Horário" value={String(e.horario || "—")} />
                    <InfoChip label="KM" value={e.km_planejado ? `${e.km_planejado} km` : (e.distancia || "—")} />
                    <InfoChip label="Participantes" value={String(participantes)} destaque={participantes > 0} />
                  </div>

                  {e.local_saida && (
                    <p className="mt-3 text-xs text-slate-500">
                      🏁 Ponto de saída: <span className="font-medium text-slate-700">{e.local_saida}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {!error && (encontros?.length || 0) > 0 && (
            <div className="text-center">
              <Link href="/encontros" className="inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">
                + Criar novo treino
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function InfoChip({ label, value, destaque = false }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${destaque ? "bg-orange-50" : "bg-slate-50"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${destaque ? "text-orange-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}
