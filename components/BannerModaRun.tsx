export default function BannerModaRun() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
      {/* Decoração */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/20" />
      <div className="absolute bottom-0 right-20 h-20 w-20 rounded-full bg-amber-400/10" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-300">
            Moda Run Store
          </span>
          <h2 className="mt-2 text-xl font-bold">
            Vista-se para correr melhor 🏃‍♂️🔥
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Kits, roupas e acessórios para treinos e provas. Peça pelo WhatsApp.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href="https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver os produtos."
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-95"
          >
            💬 WhatsApp
          </a>
          <a
            href="/loja"
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Ver loja
          </a>
        </div>
      </div>
    </div>
  );
}
