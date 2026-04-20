import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/server";

export default async function MeusEncontrosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Header />

        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Meus encontros</h1>
            <p className="mt-2 text-slate-600">Você precisa estar logado.</p>
          </div>
        </main>
      </>
    );
  }

  const { data: encontros, error } = await supabase
    .from("encontros")
    .select("*")
    .eq("user_id", user.id)
    .order("data_encontro", { ascending: true });

  if (error) {
    return (
      <>
        <Header userEmail={user.email} />

        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Meus encontros</h1>
            <p className="mt-2 text-red-600">Erro: {error.message}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header userEmail={user.email} />

      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="rounded-[28px] bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Meus encontros</h1>
            <p className="mt-2 text-slate-600">
              Aqui aparecem apenas os encontros criados por você.
            </p>
          </div>

          {encontros?.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-slate-600">Você ainda não criou encontros.</p>
            </div>
          )}

          {encontros?.map((e) => (
            <div
              key={e.id}
              className="card-hover rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-slate-900">{e.titulo}</h2>
              <p className="mt-1 text-slate-600">
                {e.cidade} - {e.estado}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Data: {String(e.data_encontro)}
              </p>
              <p className="text-sm text-slate-600">
                Distância: {e.distancia}
              </p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}