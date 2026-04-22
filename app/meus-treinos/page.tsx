import React from "react";
import Header from "@/components/Header";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import MeusTreinosClient from "@/components/MeusTreinosClient";

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function MeusTreinosPage(): Promise<React.JSX.Element> {
  const { user, isAdmin } = await getAdminStatus();

  if (!user) {
    return (
      <>
        <Header isAdmin={false} />
        <main className="min-h-screen bg-slate-50 px-4 py-12">
          <div className="mx-auto max-w-lg text-center">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">🔒</div>
              <h1 className="text-xl font-bold text-slate-900">Acesso restrito</h1>
              <p className="mt-2 text-sm text-slate-500">Você precisa estar logado para ver seus treinos.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/login" className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Entrar</Link>
                <Link href="/cadastro" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Criar conta</Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const baseQuery = supabase.from("encontros").select("*, encontro_participantes(id)").order("data_encontro", { ascending: true });
  const { data: encontros, error } = isAdmin ? await baseQuery : await baseQuery.eq("user_id", user.id);

  const encontrosFormatados = (encontros || []).map(e => ({
    ...e,
    dataFormatada: formatarData(String(e.data_encontro)),
    participantes: e.encontro_participantes?.length || 0,
    ehDono: e.user_id === user.id,
  }));

  return (
    <>
      <Header userEmail={user.email} isAdmin={isAdmin} />
      <MeusTreinosClient
        encontros={encontrosFormatados}
        error={error?.message}
        isAdmin={isAdmin}
        userId={user.id}
      />
    </>
  );
}
