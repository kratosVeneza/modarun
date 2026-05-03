import Link from "next/link";

type Section = {
  title: string;
  body: string[];
};

export default function LegalPage({ title, description, updatedAt, sections }: { title: string; description: string; updatedAt: string; sections: Section[] }) {
  return (
    <main className="min-h-screen" style={{ background: "#0D1117", color: "#E6EDF3" }}>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/" className="mb-6 inline-flex rounded-xl px-4 py-2 text-sm font-black" style={{ background: "rgba(92,200,0,0.12)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.25)" }}>
          ← Voltar para a Moda Run
        </Link>

        <div className="rounded-3xl p-6 md:p-8" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.22)" }}>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em]" style={{ color: "#5CC800" }}>Moda Run</p>
          <h1 className="text-3xl md:text-5xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{title}</h1>
          <p className="mt-3 max-w-3xl" style={{ color: "#AAB6C5" }}>{description}</p>
          <p className="mt-4 text-sm" style={{ color: "#8B949E" }}>Última atualização: {updatedAt}</p>
        </div>

        <div className="mt-6 space-y-4">
          {sections.map((section, index) => (
            <section key={section.title} className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="mb-3 text-xl font-black" style={{ color: index === 0 ? "#5CC800" : "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {section.title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#AAB6C5" }}>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(92,200,0,0.06)", border: "1px solid rgba(92,200,0,0.15)" }}>
          <Link href="/politica-de-privacidade" style={{ color: "#5CC800" }} className="text-sm font-bold">Privacidade</Link>
          <Link href="/termos-de-uso" style={{ color: "#5CC800" }} className="text-sm font-bold">Termos de uso</Link>
          <Link href="/politica-de-cookies" style={{ color: "#5CC800" }} className="text-sm font-bold">Cookies</Link>
          <Link href="/diretrizes-da-comunidade" style={{ color: "#5CC800" }} className="text-sm font-bold">Comunidade</Link>
          <Link href="/exclusao-de-conta" style={{ color: "#5CC800" }} className="text-sm font-bold">Exclusão de conta</Link>
          <Link href="/contato" style={{ color: "#5CC800" }} className="text-sm font-bold">Contato</Link>
        </div>
      </section>
    </main>
  );
}
