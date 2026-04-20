export default function KitCorrida({
  distancia,
}: {
  distancia: string;
}) {
  let sugestao = "Veja produtos ideais para sua corrida.";
  let link =
    "https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero ver produtos para corrida.";

  if (distancia.includes("5")) {
    sugestao = "Vai correr 5km? Veja o kit leve ideal 🏃‍♂️";
    link =
      "https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero o kit ideal para corrida de 5km.";
  } else if (distancia.includes("10")) {
    sugestao = "Vai correr 10km? Veja o kit ideal para performance ⚡";
    link =
      "https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero o kit para corrida de 10km.";
  } else if (distancia.includes("21")) {
    sugestao = "Vai correr 21km? Veja o kit ideal para longa distância 🔥";
    link =
      "https://wa.me/5594920009526?text=Olá! Vim pelo app Moda Run e quero o kit para corrida longa.";
  }

  return (
    <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
      <p className="text-sm font-semibold text-orange-700">{sugestao}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Ver kit no WhatsApp
        </a>

        <a
          href="/loja"
          className="rounded-2xl border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-white"
        >
          Abrir loja
        </a>
      </div>
    </div>
  );
}