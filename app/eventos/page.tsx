import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";

export default async function EventosPage() {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .order("data_evento", { ascending: true });

  if (error) {
    return (
      <>
        <Header userEmail={user?.email} />

        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-5xl rounded-[28px] border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Eventos</h1>
            <p className="mt-2 text-red-600">Erro ao carregar: {error.message}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header userEmail={user?.email} />

      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-[32px] bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-2xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-200">
              Moda Run
            </span>

            <h1 className="mt-4 text-3xl font-bold sm:text-5xl">
              Descubra os próximos eventos
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              Encontre corridas, provas e oportunidades para participar da comunidade.
            </p>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Eventos disponíveis</h2>
              <p className="mt-1 text-sm text-slate-500">
                Veja corridas e escolha sua próxima prova.
              </p>
            </div>

            {data?.length === 0 && (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                Nenhum evento encontrado.
              </div>
            )}

            <div className="grid gap-4">
              {data?.map((evento) => (
                <article
                  key={evento.id}
                  className="card-hover rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          {evento.nome}
                        </h3>

                        {evento.destaque && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            Destaque
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {evento.cidade} - {evento.estado}
                      </p>
                    </div>

                    {evento.link_inscricao && (
                      <a
                        href={evento.link_inscricao}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                      >
                        Inscrição
                      </a>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem label="Data" value={String(evento.data_evento)} />
                    <InfoItem label="Distância" value={evento.distancia} />
                    <InfoItem label="Local" value={evento.local} />
                    <InfoItem
                      label="Tipo"
                      value={evento.destaque ? "Evento destaque" : "Evento"}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}