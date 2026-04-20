export default function BannerModaRun() {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white shadow-lg">
      <h2 className="text-2xl font-bold">Corra na moda 🏃‍♂️🔥</h2>

      <p className="mt-2 text-sm text-orange-100">
        Aproveite nossas promoções em conjuntos fitness, tênis e acessórios
        ideais para sua corrida.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="https://wa.me/5594920009526"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-orange-600"
        >
          Falar no WhatsApp
        </a>

        <a
          href="/loja"
          className="rounded-2xl border border-white px-4 py-2 text-sm font-semibold text-white"
        >
          Ver produtos
        </a>
      </div>
    </div>
  );
}