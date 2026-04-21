import Header from "@/components/Header";
import ParticiparEncontro from "@/components/ParticiparEncontro";
import KitCorrida from "@/components/KitCorrida";
import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/lib/supabase";

export default async function TreinoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const { data: treino, error } = await supabase
    .from("encontros")
    .select(`
      *,
      encontro_participantes (
        id,
        nome
      )
    `)
    .eq("id", id)
    .single();

  if (error || !treino) {
    return (
      <>
        <Header userEmail={user?.email} />
        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-4xl rounded-[28px] bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Treino</h1>
            <p className="mt-2 text-red-600">
              Não foi possível carregar esse treino.
            </p>
          </div>
        </main>
      </>
    );
  }

  const linkTreino = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/treinos/${treino.id}`;

  return (
    <>
      <Header userEmail={user?.email} />

      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-[32px] bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white shadow-2xl">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Treino em Grupo
            </span>

            <h1 className="mt-4 text-3xl font-bold sm:text-5xl">
              {treino.titulo}
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-orange-50 sm:text-base">
              Participe deste treino e convide outras pessoas para correr junto.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Participe deste treino comigo: ${linkTreino}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-orange-600"
              >
                Compartilhar no WhatsApp
              </a>

              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white px-4 py-2 text-sm font-semibold text-white"
              >
                Divulgar no Instagram
              </a>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Detalhes do treino
                </h2>
                <p className="mt-2 text-slate-600">
                  {treino.cidade} - {treino.estado}
                </p>
              </div>

              <ParticiparEncontro encontroId={treino.id} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Data" value={String(treino.data_encontro)} />
              <InfoItem label="Horário" value={String(treino.horario)} />
              <InfoItem label="Local de saída" value={treino.local_saida} />
              <InfoItem label="Distância" value={treino.distancia} />
              <InfoItem
                label="Ritmo"
                value={treino.ritmo || "Não informado"}
              />
              <InfoItem
                label="Organizador"
                value={treino.organizador_nome || "Não informado"}
              />
            </div>

            <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Participantes: {treino.encontro_participantes?.length || 0}
            </div>

            {treino.percurso && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Percurso</p>
                <p className="mt-1 text-sm text-slate-600">{treino.percurso}</p>
              </div>
            )}

            {treino.observacoes && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Observações</p>
                <p className="mt-1 text-sm text-slate-600">{treino.observacoes}</p>
              </div>
            )}

            <KitCorrida distancia={treino.distancia} />

            {treino.encontro_participantes &&
              treino.encontro_participantes.length > 0 && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Participantes confirmados
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {treino.encontro_participantes.map(
                      (p: { id: number; nome: string }) => (
                        <span
                          key={p.id}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {p.nome}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
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