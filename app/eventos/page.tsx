import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";

function formatarData(data: string) {
  if (!data) return "—";
  try {
    const [ano, mes, dia] = String(data).split("-");
    return `${dia}/${mes}/${ano}`;
  } catch {
    return String(data);
  }
}

export default async function EventosPage() {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .order("data_evento", { ascending: true });

  return (
    <>
      <Header userEmail={user?.email} />

      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 to-slate-800 p-8 text-white shadow-2xl sm:p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10" />
            <div className="absolute bottom-0 right-10 h-32 w-32 rounded-full bg-amber-400/5" />

            <div className="relative max-w-2xl">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-orange-300">
                Eventos de Corrida
              </span>
              <h1 className="mt-4 text-3xl font-bold sm:text-5xl leading-tight">
                Próximas corridas
                <br />
                <span className="text-orange-400">no Brasil</span>
              </h1>
              <p className="mt-4 text-sm text-slate-400 sm:text-base">
                Encontre corridas, provas de rua e maratonas. Filtre por cidade ou estado.
              </p>
            </div>
          </section>

          {/* Conteúdo */}
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Eventos disponíveis</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {error ? "Erro ao carregar" : `${data?.length || 0} evento${(data?.length || 0) !== 1 ? "s" : ""} encontrado${(data?.length || 0) !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Erro ao carregar eventos: {error.message}
              </div>
            )}

            {!error && data?.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="text-4xl mb-2">🏁</div>
                <p className="font-semibold text-slate-700">Nenhum evento cadastrado ainda</p>
                <p className="mt-1 text-sm text-slate-500">
                  Fique de olho — novos eventos são adicionados regularmente.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {data?.map((evento) => (
                <article
                  key={evento.id}
                  className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {evento.nome}
                        </h3>
                        {evento.destaque && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                            ⭐ Destaque
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        📍 {evento.cidade} — {evento.estado}
                      </p>
                    </div>

                    {evento.link_inscricao && (
                      <a
                        href={evento.link_inscricao}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
                      >
                        Inscrever-se →
                      </a>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <InfoChip label="Data" value={formatarData(String(evento.data_evento))} />
                    <InfoChip label="Distância" value={evento.distancia || "—"} />
                    <InfoChip label="Local" value={evento.local || "—"} />
                    <InfoChip label="Tipo" value={evento.destaque ? "Destaque" : "Evento"} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Banner loja */}
          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-900">Se preparando para uma prova? 🏅</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Veja os kits recomendados pela Moda Run para cada distância.
                </p>
              </div>
              <a
                href="/loja"
                className="shrink-0 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Ver loja
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
