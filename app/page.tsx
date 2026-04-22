import Link from "next/link";
import Header from "@/components/Header";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { user, isAdmin } = await getAdminStatus();

  const [{ count: totalTreinos }, { count: totalParticipantes }, { data: proximosTreinos }, { data: proximosEventos }] = await Promise.all([
    supabase.from("encontros").select("*", { count: "exact", head: true }),
    supabase.from("encontro_participantes").select("*", { count: "exact", head: true }),
    supabase.from("encontros").select("id, titulo, cidade, estado, data_encontro, horario, tipo_treino, km_planejado, distancia").order("data_encontro", { ascending: true }).limit(3),
    supabase.from("eventos").select("id, nome, cidade, estado, data_evento, distancia").order("data_evento", { ascending: true }).limit(2),
  ]);

  function formatarData(data: string) {
    if (!data) return "—";
    const [, mes, dia] = String(data).split("-");
    return `${dia}/${mes}`;
  }

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-16 text-white sm:py-24">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-orange-500/10" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-400/5" />
          <div className="relative mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300">🏃 Moda Run App</span>
              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">
                Corra em grupo.<br /><span className="text-orange-400">Vista-se para vencer.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-slate-400 sm:text-lg">
                Organize treinos, encontre corredores na sua cidade e equipamentos para cada prova — tudo num só lugar.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {user ? (
                  <>
                    <Link href="/encontros" className="rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-95">🏃 Ver treinos</Link>
                    <Link href="/perfil" className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Meu perfil</Link>
                  </>
                ) : (
                  <>
                    <Link href="/cadastro" className="rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-95">Criar conta grátis</Link>
                    <Link href="/encontros" className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Ver treinos</Link>
                  </>
                )}
              </div>
            </div>
            <div className="mt-12 flex flex-wrap gap-6">
              <div><p className="text-3xl font-bold text-white">{totalTreinos || 0}</p><p className="text-sm text-slate-400">Treinos criados</p></div>
              <div className="w-px bg-white/10" />
              <div><p className="text-3xl font-bold text-white">{totalParticipantes || 0}</p><p className="text-sm text-slate-400">Confirmações de presença</p></div>
              <div className="w-px bg-white/10" />
              <div><p className="text-3xl font-bold text-orange-400">Grátis</p><p className="text-sm text-slate-400">Para sempre</p></div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">🏃 Próximos treinos</h2>
              <Link href="/encontros" className="text-sm font-semibold text-orange-600 hover:underline">Ver todos →</Link>
            </div>
            {!proximosTreinos || proximosTreinos.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">Nenhum treino criado ainda.</p>
                <Link href="/encontros" className="mt-3 inline-flex rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">Criar o primeiro treino</Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {proximosTreinos.map((t) => (
                  <Link key={t.id} href={`/treinos/${t.id}`}
                    className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-orange-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-bold text-slate-900">{t.titulo}</p>
                        <p className="mt-0.5 text-xs text-slate-500">📍 {t.cidade} - {t.estado}</p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600">{formatarData(String(t.data_encontro))}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.tipo_treino && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{t.tipo_treino}</span>}
                      {(t.km_planejado || t.distancia) && <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">{t.km_planejado ? `${t.km_planejado}km` : t.distancia}</span>}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-orange-500 group-hover:translate-x-1 transition-transform">{t.horario} — Ver detalhes →</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {proximosEventos && proximosEventos.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">🏁 Próximas provas</h2>
                <Link href="/eventos" className="text-sm font-semibold text-orange-600 hover:underline">Ver todas →</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {proximosEventos.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-orange-50">
                      <p className="text-lg font-bold text-orange-600 leading-none">{formatarData(String(e.data_evento))}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">{e.nome}</p>
                      <p className="text-xs text-slate-500">📍 {e.cidade} — {e.estado}</p>
                      {e.distancia && <p className="mt-0.5 text-xs font-semibold text-orange-600">{e.distancia}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/eventos", emoji: "🏁", titulo: "Eventos", desc: "Corridas e provas no Brasil" },
              { href: "/encontros", emoji: "🏃", titulo: "Treinos", desc: "Treinos em grupo na sua cidade" },
              { href: "/loja", emoji: "🛍", titulo: "Loja", desc: "Roupas e acessórios" },
              { href: "/meus-treinos", emoji: "📋", titulo: "Meus treinos", desc: "Gerencie o que criou" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-orange-200">
                <span className="text-2xl">{item.emoji}</span>
                <h3 className="mt-2 font-bold text-slate-900">{item.titulo}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                <p className="mt-3 text-xs font-semibold text-orange-500 transition-transform group-hover:translate-x-1">Acessar →</p>
              </Link>
            ))}
          </section>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-amber-400 p-7 text-white shadow-lg">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold">Equipado para correr? 🔥</p>
                <p className="mt-1 text-sm text-orange-100">Conjuntos, calçados e acessórios da Moda Run.</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run." target="_blank" rel="noreferrer"
                  className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-orange-600 hover:shadow-md transition">💬 WhatsApp</a>
                <Link href="/loja" className="rounded-2xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition">Ver loja</Link>
              </div>
            </div>
          </section>

          {!user && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-900">Pronto para correr? 🏃</p>
              <p className="mt-2 text-sm text-slate-500">Crie sua conta gratuita e comece a organizar treinos com sua comunidade.</p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/cadastro" className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600">Criar conta grátis</Link>
                <Link href="/login" className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Já tenho conta</Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
