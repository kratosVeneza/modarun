import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import ParticiparEncontro from "@/components/ParticiparEncontro";
import MapaTreinoVisualizacao from "@/components/MapaTreinoVisualizacao";

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function TreinoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: treino, error } = await supabase.from("encontros").select("*, encontro_participantes(id, nome)").eq("id", id).single();
  if (error || !treino) return notFound();
  const participantes = treino.encontro_participantes || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-5">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-white shadow-md">MR</div>
            <span className="text-base font-bold text-slate-900">Moda Run</span>
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-500 to-amber-400 p-7 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex flex-wrap gap-2">
              {treino.tipo_treino && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{treino.tipo_treino}</span>}
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{participantes.length} confirmado{participantes.length !== 1 ? "s" : ""}</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold">{treino.titulo}</h1>
            <p className="mt-1 text-sm text-orange-100">📍 {treino.cidade} - {treino.estado}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {[["📅","Data",formatarData(String(treino.data_encontro))],["⏰","Horário",String(treino.horario||"—")],["📏","Distância",treino.distancia||(treino.km_planejado?`${treino.km_planejado} km`:"—")],["👤","Organizador",treino.organizador_nome||"—"]].map(([icon,label,value])=>(
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-lg">{icon}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </section>

        {treino.local_saida && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-slate-900">📍 Ponto de encontro</h2>
            <p className="text-sm font-semibold text-slate-700">{treino.local_saida}</p>
          </section>
        )}

        {treino.ponto_encontro_lat && treino.ponto_encontro_lng && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-900">🗺 Percurso</h2>
            <MapaTreinoVisualizacao pontoEncontro={{ lat: treino.ponto_encontro_lat, lng: treino.ponto_encontro_lng }} rotaCoords={treino.rota_coords || []} />
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Participantes <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">{participantes.length}</span></h2>
            <ParticiparEncontro encontroId={treino.id} />
          </div>
          {participantes.length === 0 ? <p className="text-sm text-slate-500">Seja o primeiro a confirmar!</p> : (
            <div className="flex flex-wrap gap-2">
              {participantes.map((p: { id: number; nome: string }) => (
                <span key={p.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">{p.nome[0].toUpperCase()}</span>
                  {p.nome}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
          <p className="text-sm font-semibold text-orange-300">Moda Run Store</p>
          <p className="mt-1 text-base font-bold">Equipado para correr? 🏃‍♂️</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="https://wa.me/5594920009526" target="_blank" rel="noreferrer" className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">💬 WhatsApp</a>
            <a href="/loja" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">Ver loja</a>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
          Quer criar seus próprios treinos?{" "}
          <Link href="/cadastro" className="font-semibold text-orange-600 hover:underline">Criar conta grátis</Link>
        </div>
      </div>
    </main>
  );
}
