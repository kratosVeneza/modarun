import { supabase } from "@/lib/supabase";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import EncontroForm from "@/components/EncontroForm";
import FiltroEncontros from "@/components/FiltroEncontros";
import ParticiparEncontro from "@/components/ParticiparEncontro";
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

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <main className="min-h-screen px-4 py-8" style={{ background: "#0D1117" }}>
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl px-6 py-10" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
                style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
                ⚡ MODA RUN
              </div>
              <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
                TREINOS EM GRUPO
              </h1>
              <p className="mt-3 max-w-2xl text-sm" style={{ color: "#8B949E" }}>
                Organize corridas, marque pontos de encontro e treine com outras pessoas na sua cidade.
              </p>
            </div>
          </section>

          {/* Formulário criar treino */}
          <EncontroForm />

          {/* Filtro */}
          <FiltroEncontros cidadeInicial={cidadeFiltro} />

          {/* Lista */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
                <h2 className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.02em" }}>
                  LISTA DE TREINOS
                </h2>
              </div>
              <span className="text-sm" style={{ color: "#8B949E" }}>
                {error ? "Erro ao carregar" : cidadeFiltro ? `Filtrando: ${cidadeFiltro}` : `${data?.length || 0} treino${data?.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {(!data || data.length === 0) && (
              <div className="rounded-2xl p-8 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.2)" }}>
                <p className="text-3xl mb-2">🏃</p>
                <p className="font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {cidadeFiltro ? `Nenhum treino em "${cidadeFiltro}"` : "NENHUM TREINO AINDA"}
                </p>
                <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Seja o primeiro a criar um treino!</p>
              </div>
            )}

            <div className="grid gap-4">
              {data?.map((e) => {
                const participantes = e.encontro_participantes || [];
                return (
                  <article key={e.id} className="relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
                    style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.12)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />

                    <div className="p-5">
                      {/* Header do card */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{e.titulo}</h3>
                            {e.tipo_treino && (
                              <span className="rounded-lg px-2.5 py-0.5 text-xs font-black" style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{e.tipo_treino}</span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: "#8B949E" }}>📍 {e.cidade} — {e.estado}</p>
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black"
                            style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            👥 {participantes.length} participante{participantes.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <ParticiparEncontro encontroId={e.id} />
                      </div>

                      {/* Info grid */}
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          ["📅", "DATA", formatarData(String(e.data_encontro))],
                          ["⏰", "HORÁRIO", String(e.horario || "—")],
                          ["🏁", "LOCAL", e.local_saida || "—"],
                          ...(e.distancia || e.km_planejado ? [["📏", "DISTÂNCIA", e.distancia || `${e.km_planejado}km`]] : []),
                          ...(e.ritmo ? [["🎯", "RITMO", e.ritmo]] : []),
                          ...(e.organizador_nome ? [["🏃", "ORGANIZADOR", e.organizador_nome]] : []),
                        ].map(([icon, label, value]) => (
                          <div key={String(label)} className="rounded-xl p-3" style={{ background: "#21262D" }}>
                            <p className="text-xs font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>{icon} {label}</p>
                            <p className="mt-0.5 text-sm font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Participantes */}
                      {participantes.length > 0 && (
                        <div className="mt-3 rounded-xl p-3" style={{ background: "#21262D" }}>
                          <p className="text-xs font-black mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>👥 PARTICIPANTES</p>
                          <div className="flex flex-wrap gap-1.5">
                            {participantes.map((p: { id: number; nome: string }) => (
                              <span key={p.id} className="rounded-lg px-2.5 py-1 text-xs font-bold"
                                style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.15)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {p.nome}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações / percurso */}
                      {(e.percurso || e.observacoes) && (
                        <div className="mt-3 rounded-xl p-3" style={{ background: "#21262D" }}>
                          {e.percurso && <p className="text-xs" style={{ color: "#8B949E" }}>🗺 <strong style={{ color: "#E6EDF3" }}>Percurso:</strong> {e.percurso}</p>}
                          {e.observacoes && <p className="text-xs mt-1" style={{ color: "#8B949E" }}>📝 <strong style={{ color: "#E6EDF3" }}>Obs:</strong> {e.observacoes}</p>}
                        </div>
                      )}

                      {/* Botões */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href={`/treinos/${e.id}`}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:brightness-110"
                          style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                          ⚡ ABRIR TREINO
                        </a>
                        <a href="/loja"
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:brightness-110"
                          style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                          🛒 VER LOJA
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
