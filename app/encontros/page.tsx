import { supabase } from "@/lib/supabase";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import EncontroForm from "@/components/EncontroForm";
import FiltroEncontros from "@/components/FiltroEncontros";
import ParticiparEncontro from "@/components/ParticiparEncontro";
import BannerModaRun from "@/components/BannerModaRun";
import KitCorrida from "@/components/KitCorrida";
import Header from "@/components/Header";

type SearchParams = Promise<{ cidade?: string }>;

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function EncontrosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const cidadeFiltro = params.cidade?.trim() || "";

  const { user, isAdmin } = await getAdminStatus();

  let query = supabase
    .from("encontros")
    .select("*, encontro_participantes(id, nome)")
    .order("data_encontro", { ascending: true });

  if (cidadeFiltro) query = query.ilike("cidade", `%${cidadeFiltro}%`);

  const { data, error } = await query;

  if (error) {
    return (
      <>
        <Header userEmail={user?.email} isAdmin={isAdmin} />
        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Treinos em Grupo</h1>
            <p className="mt-2 text-red-600">Erro ao carregar: {error.message}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />

      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">

          <section className="rounded-[28px] bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white shadow-lg">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">Moda Run</span>
            <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Treinos em Grupo</h1>
            <p className="mt-3 max-w-2xl text-sm text-orange-50 sm:text-base">
              Organize corridas, marque pontos de encontro e treine com outras pessoas na sua cidade.
            </p>
          </section>

          <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
            Crie um treino e defina o ponto de encontro para correr com outras pessoas 🏃‍♂️
          </div>

          <EncontroForm />

          <BannerModaRun />

          <FiltroEncontros cidadeInicial={cidadeFiltro} />

          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Lista de treinos</h2>
              <p className="mt-1 text-sm text-slate-500">
                {cidadeFiltro ? `Mostrando treinos para: ${cidadeFiltro}` : "Veja treinos disponíveis e escolha um ponto de encontro para correr"}
              </p>
            </div>

            {data && data.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                Nenhum treino encontrado para esse filtro.
              </div>
            )}

            <div className="grid gap-4">
              {data?.map((e) => (
                <article key={e.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{e.titulo}</h3>
                        {e.tipo_treino && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">{e.tipo_treino}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{e.cidade} - {e.estado}</p>
                      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Participantes: {e.encontro_participantes?.length || 0}
                      </div>
                    </div>
                    <ParticiparEncontro encontroId={e.id} />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem label="Data" value={formatarData(String(e.data_encontro))} />
                    <InfoItem label="Horário" value={String(e.horario || "—")} />
                    <InfoItem label="Local de saída" value={e.local_saida || "—"} />
                    {e.distancia && <InfoItem label="Distância" value={e.distancia} />}
                    {e.ritmo && <InfoItem label="Ritmo" value={e.ritmo} />}
                    {e.distancia && <KitCorrida distancia={e.distancia} />}
                    {e.organizador_nome && <InfoItem label="Organizador" value={e.organizador_nome} />}
                  </div>

                  {e.percurso && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">Percurso</p>
                      <p className="mt-1 text-sm text-slate-600">{e.percurso}</p>
                    </div>
                  )}

                  {e.observacoes && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">Observações</p>
                      <p className="mt-1 text-sm text-slate-600">{e.observacoes}</p>
                    </div>
                  )}

                  {e.encontro_participantes && e.encontro_participantes.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">Participantes</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {e.encontro_participantes.map((p: { id: number; nome: string }) => (
                          <span key={p.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {p.nome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={`/treinos/${e.id}`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Abrir treino
                    </a>
                    <a href="/loja" className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                      🔥 Ver kit ideal para essa corrida
                    </a>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
