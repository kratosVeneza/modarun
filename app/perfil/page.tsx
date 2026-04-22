"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type Treino = { id: number; titulo: string; cidade: string; estado: string; data_encontro: string; tipo_treino?: string; km_planejado?: number; distancia?: string };

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [nomeEditando, setNomeEditando] = useState(false);
  const [nomeTemp, setNomeTemp] = useState("");
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email || "");
      const nome = user.user_metadata?.nome_exibicao || user.email?.split("@")[0] || "Corredor";
      setNomeExibicao(nome); setNomeTemp(nome);
      const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
      setIsAdmin(!!adminRow);
      const { data: treinosData } = await supabase.from("encontros").select("id, titulo, cidade, estado, data_encontro, tipo_treino, km_planejado, distancia").eq("user_id", user.id).order("data_encontro", { ascending: false });
      setTreinos(treinosData || []);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvarNome() {
    setSalvandoNome(true);
    const { error } = await supabase.auth.updateUser({ data: { nome_exibicao: nomeTemp.trim() } });
    if (!error) { setNomeExibicao(nomeTemp.trim()); setNomeEditando(false); }
    setSalvandoNome(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <>
        <Header userEmail={userEmail} isAdmin={isAdmin} />
        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          </div>
        </main>
      </>
    );
  }

  const inicial = nomeExibicao[0]?.toUpperCase() || "?";

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 text-3xl font-bold text-white shadow-lg">{inicial}</div>
              <div className="flex-1">
                {nomeEditando ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={nomeTemp} onChange={(e) => setNomeTemp(e.target.value)} autoFocus className="w-full rounded-2xl border border-orange-300 px-4 py-2 text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-orange-100" />
                    <button onClick={salvarNome} disabled={salvandoNome} className="shrink-0 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">{salvandoNome ? "..." : "Salvar"}</button>
                    <button onClick={() => { setNomeEditando(false); setNomeTemp(nomeExibicao); }} className="shrink-0 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-900">{nomeExibicao}</h1>
                    <button onClick={() => setNomeEditando(true)} className="rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-400 hover:bg-slate-50">✏️ Editar</button>
                  </div>
                )}
                <p className="mt-0.5 text-sm text-slate-500">{userEmail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">🏃 {treinos.length} treino{treinos.length !== 1 ? "s" : ""} criado{treinos.length !== 1 ? "s" : ""}</span>
                  {isAdmin && <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">👑 Admin</span>}
                </div>
              </div>
              <button onClick={handleLogout} className="shrink-0 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">Sair</button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Meus treinos <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{treinos.length}</span></h2>
              <Link href="/encontros" className="text-xs font-semibold text-orange-600 hover:underline">+ Criar treino</Link>
            </div>
            {treinos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-500">Você ainda não criou treinos.</p>
                <Link href="/encontros" className="mt-3 inline-flex rounded-2xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Criar primeiro treino</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {treinos.map((t) => (
                  <Link key={t.id} href={`/treinos/${t.id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-orange-200 hover:bg-orange-50 transition">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.titulo}</p>
                      <p className="text-xs text-slate-500">{t.cidade} · {formatarData(t.data_encontro)}{t.tipo_treino && ` · ${t.tipo_treino}`}</p>
                    </div>
                    <span className="text-xs font-bold text-orange-500">{t.km_planejado ? `${t.km_planejado}km` : t.distancia || "→"}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-3 gap-3">
            {[["Treinos criados", treinos.length], ["KM planejados", treinos.reduce((acc, t) => acc + (t.km_planejado || 0), 0)]].map(([l, v]) => (
              <div key={String(l)} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-orange-500">{v}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">{l}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-orange-500">🏃</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">Corredor ativo</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
