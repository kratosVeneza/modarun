import Header from "@/components/Header";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import GerenciarEventos from "@/components/GerenciarEventos";
import GerenciarProdutos from "@/components/GerenciarProdutos";
import AdminTabs from "@/components/AdminTabs";

type SearchParams = Promise<{ aba?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { user, isAdmin } = await getAdminStatus();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const params = await searchParams;
  const abaAtiva = params.aba || "eventos";

  const [{ data: eventos }, { data: produtos }] = await Promise.all([
    supabase.from("eventos").select("*").order("data_evento", { ascending: true }),
    supabase.from("produtos").select("*").order("ordem").order("criado_em", { ascending: false }),
  ]);

  return (
    <>
      <Header userEmail={user.email} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-800 p-7 text-white shadow-xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">👑 Painel Admin</span>
            <h1 className="mt-3 text-2xl font-bold">Central de administração</h1>
            <p className="mt-1 text-sm text-slate-400">Gerencie eventos, produtos da loja e configurações do app.</p>
          </section>
          <AdminTabs abaAtiva={abaAtiva} />
          {abaAtiva === "eventos" && <GerenciarEventos eventosIniciais={eventos || []} />}
          {abaAtiva === "produtos" && <GerenciarProdutos produtosIniciais={produtos || []} />}
        </div>
      </main>
    </>
  );
}
