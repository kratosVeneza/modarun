import { produtos } from "@/data/produtos";

export default function LojaPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white shadow-lg">
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Moda Run
          </span>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Loja Moda Run
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-orange-50 sm:text-base">
            Roupas, acessórios e itens para você correr com estilo, conforto e
            performance.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver os produtos disponíveis."
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-orange-600"
            >
              Comprar no WhatsApp
            </a>

            <a
              href="https://instagram.com/modarun.oficial"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white px-4 py-2 text-sm font-semibold text-white"
            >
              Ver Instagram
            </a>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Produtos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Escolha seu item e fale direto com a Moda Run.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {produtos.map((produto) => (
              <article
                key={produto.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  className="h-56 w-full object-cover"
                />

                <div className="p-5">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    {produto.categoria}
                  </span>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {produto.nome}
                  </h3>

                  <p className="mt-2 text-base font-semibold text-slate-800">
                    {produto.preco}
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    <a
                      href={produto.whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      Comprar no WhatsApp
                    </a>

                    <a
                      href="https://instagram.com/modarun.oficial"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ver no Instagram
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}