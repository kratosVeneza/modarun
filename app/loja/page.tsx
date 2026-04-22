import React from "react";
import Header from "@/components/Header";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import { supabase } from "@/lib/supabase";
import LojaClient from "@/components/LojaClient";

export default async function LojaPage(): Promise<React.JSX.Element> {
  const { user, isAdmin } = await getAdminStatus();

  const { data: produtos } = await supabase
    .from("produtos").select("*")
    .eq("estoque_disponivel", true)
    .order("destaque", { ascending: false })
    .order("ordem").order("criado_em", { ascending: false });

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">

          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 p-8 text-white shadow-xl sm:p-12">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="relative max-w-lg">
              <span className="inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wider">Loja Oficial</span>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Corra na moda.<br />Vista-se para vencer.</h1>
              <p className="mt-3 text-sm text-orange-100 sm:text-base">Roupas, calçados e acessórios para corredores de todos os níveis.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver os produtos." target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-md hover:shadow-lg">💬 WhatsApp</a>
                <a href="https://instagram.com/modarun.oficial" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">📸 Instagram</a>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Produtos</h2>
              <p className="mt-1 text-sm text-slate-500">{produtos?.length || 0} {(produtos?.length || 0) === 1 ? "item disponível" : "itens disponíveis"}</p>
            </div>

            {!produtos || produtos.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-4xl">🛍</p>
                <p className="mt-3 font-semibold text-slate-700">Produtos em breve</p>
                <p className="mt-1 text-sm text-slate-500">Entre em contato pelo WhatsApp para ver o catálogo completo.</p>
                <a href="https://wa.me/5594920009526" target="_blank" rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">💬 Falar no WhatsApp</a>
              </div>
            ) : (
              <LojaClient produtos={produtos} />
            )}
          </section>

          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-center">
            <p className="text-base font-bold text-slate-900">Não encontrou o que procura?</p>
            <p className="mt-1 text-sm text-slate-500">Entre em contato e veja o catálogo completo.</p>
            <a href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver o catálogo completo." target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">💬 Falar com a Moda Run</a>
          </section>
        </div>
      </main>
    </>
  );
}
