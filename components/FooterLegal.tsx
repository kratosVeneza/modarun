import Link from "next/link";

const links = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/politica-de-cookies", label: "Política de Cookies" },
  { href: "/diretrizes-da-comunidade", label: "Diretrizes da Comunidade" },
  { href: "/exclusao-de-conta", label: "Exclusão de Conta e Dados" },
  { href: "/contato", label: "Contato" },
];

export default function FooterLegal() {
  return (
    <footer className="border-t border-[#5CC800]/15 bg-[#0D1117] px-4 py-8 text-sm text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black uppercase tracking-[0.18em] text-[#5CC800]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Moda Run
          </p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
            Comunidade, eventos, treinos e loja para corredores. Use o app com respeito às regras da comunidade e às políticas da plataforma.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end" aria-label="Links legais e institucionais">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-bold uppercase tracking-wide text-slate-400 transition hover:text-[#5CC800]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-6 max-w-6xl border-t border-white/5 pt-4 text-xs text-slate-600">
        © {new Date().getFullYear()} Moda Run. Todos os direitos reservados.
      </div>
    </footer>
  );
}
