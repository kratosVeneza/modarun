import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ferramentas para Corredores: Calculadoras e Planos Grátis",
  description: "Calculadoras de pace e frequência cardíaca, planos de treino do zero ao 5km, 10km e meia maratona, histórico e gerador de imagem para Stories. Tudo grátis.",
  alternates: { canonical: "/ferramentas" },
  openGraph: {
    title: "Ferramentas para Corredores: Calculadoras e Planos Grátis",
    description: "Calculadoras de pace e frequência cardíaca, planos de treino do zero ao 5km, 10km e meia maratona, histórico e gerador de imagem para Stories. Tudo grátis.",
    url: "/ferramentas",
    type: "website",
  },
  twitter: {
    title: "Ferramentas para Corredores: Calculadoras e Planos Grátis",
    description: "Calculadoras de pace e frequência cardíaca, planos de treino do zero ao 5km, 10km e meia maratona, histórico e gerador de imagem para Stories. Tudo grátis.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
