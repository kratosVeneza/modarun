import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import FiltroEventos from "@/components/FiltroEventos";

type SearchParams = Promise<{ cidade?: string; estado?: string }>;

function formatarData(data: string) {
  if (!data) return "—";
  try { const [ano, mes, dia] = String(data).split("-"); return `${dia}/${mes}/${ano}`; } catch { return String(data); }
}

export default async function EventosPage({ searchParams }: { searchParams: SearchParams }) {
  const { user, isAdmin } = await getAdminStatus();
  const params = await searchParams;
  const cidadeFiltro = params.cidade?.trim() || "";
  const estadoFiltro = params.estado?.trim() || "";

  let query = supabase.from("eventos").select("*").order("data_evento", { ascending: true });
  if (cidadeFiltro) query = query.ilike("cidade", `%${cidadeFiltro}%`);
  if (estadoFiltro) query = query.ilike("estado", `%${estadoFiltro}%`);
  const { data, error } = await query;
  const temFiltro = !!(cidadeFiltro || estadoFiltro);

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 to-slate-800 p-8 text-white shadow-2xl sm:p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10" />
            <div className="relative max-w-2xl">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-orange-300">Eventos de Corrida</span>
              <h1 className="mt-4 text-3xl font-bold sm:text-5xl leading-tight">Próximas corridas<br /><span className="text-orange-400">no Brasil</span></h1>
              <p className="mt-4 text-sm text-slate-400 sm:text-base">Encontre corridas, provas de rua e maratonas perto de você.</p>
            </div>
          </section>

          <FiltroEventos cidadeInicial={cidadeFiltro} estadoInicial={estadoFiltro} />

          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Eventos disponíveis</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {error ? "Erro ao carregar" : temFiltro ? `${data?.length || 0} resultado${(data?.length||0)!==1?"s":""} para o filtro` : `${data?.length || 0} evento${(data?.length||0)!==1?"s":""} encontrado${(data?.length||0)!==1?"s":""}`}
                </p>
              </div>
              {temFiltro && <a href="/eventos" className="text-xs font-semibold text-orange-600 hover:underline">Limpar filtros</a>}
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">Erro: {error.message}</div>}

            {!error && data?.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="text-4xl mb-2">🏁</div>
                <p className="font-semibold text-slate-700">{temFiltro ? "Nenhum evento para esse filtro" : "Nenhum evento cadastrado ainda"}</p>
                {temFiltro && <a href="/eventos" className="mt-4 inline-flex rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Ver todos os eventos</a>}
              </div>
            )}

            <div className="space-y-4">
              {data?.map((evento) => (
                <article key={evento.id} className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{evento.nome}</h3>
                        {evento.destaque && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">⭐ Destaque</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">📍 {evento.cidade} — {evento.estado}</p>
                    </div>
                    {evento.link_inscricao && (
                      <a href={evento.link_inscricao} target="_blank" rel="noreferrer" className="shrink-0 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95">Inscrever-se →</a>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[["Data", formatarData(String(evento.data_evento))],["Distância",evento.distancia||"—"],["Local",evento.local||"—"],["Tipo",evento.destaque?"Destaque":"Evento"]].map(([l,v])=>(
                      <div key={l} className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{v}</p></div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-bold text-slate-900">Se preparando para uma prova? 🏅</p><p className="mt-0.5 text-sm text-slate-500">Veja os kits recomendados pela Moda Run para cada distância.</p></div>
              <a href="/loja" className="shrink-0 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Ver loja</a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
