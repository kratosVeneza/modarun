import { produtos } from "@/data/produtos";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/server";

const categorias = ["Todos", "Conjunto", "Calçado", "Acessório", "Nutrição"];

export default async function LojaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header userEmail={user?.email} />

      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 p-8 text-white shadow-xl sm:p-12">
            {/* Decoração de fundo */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 right-32 h-40 w-40 rounded-full bg-white/5" />

            <div className="relative max-w-lg">
              <span className="inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wider">
                Loja Oficial
              </span>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                Corra na moda.
                <br />
                Vista-se para vencer.
              </h1>
              <p className="mt-3 text-sm text-orange-100 sm:text-base">
                Roupas, calçados e acessórios selecionados para corredores de todos os níveis.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver os produtos disponíveis."
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-md transition hover:shadow-lg active:scale-95"
                >
                  <span>💬</span> WhatsApp
                </a>
                <a
                  href="https://instagram.com/modarun.oficial"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <span>📸</span> Instagram
                </a>
              </div>
            </div>
          </section>

          {/* Produtos */}
          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Produtos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {produtos.length} itens disponíveis · Peça pelo WhatsApp ou Instagram
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {produtos.map((produto) => (
                <article
                  key={produto.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                      {produto.categoria}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {produto.nome}
                    </h3>
                    <p className="mt-1 text-xl font-bold text-orange-600">
                      {produto.preco}
                    </p>

                    <div className="mt-4 space-y-2">
                      <a
                        href={produto.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-95"
                      >
                        💬 Comprar no WhatsApp
                      </a>
                      <a
                        href="https://instagram.com/modarun.oficial"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        📸 Ver no Instagram
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* CTA final */}
          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-center">
            <p className="text-base font-bold text-slate-900">
              Não encontrou o que procura?
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Entre em contato direto e veja o catálogo completo.
            </p>
            <a
              href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver o catálogo completo."
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              💬 Falar com a Moda Run
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
