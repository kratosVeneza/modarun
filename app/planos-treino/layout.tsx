import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planos de Treino de Corrida: do Zero ao 5km, 10km e Meia",
  description: "Programas de treino semana a semana para corredores: comece do zero rumo ao 5km, evolua de 5km para 10km e prepare sua primeira meia maratona. Grátis.",
  alternates: { canonical: "/planos-treino" },
  openGraph: {
    title: "Planos de Treino de Corrida: do Zero ao 5km, 10km e Meia",
    description: "Programas de treino semana a semana para corredores: comece do zero rumo ao 5km, evolua de 5km para 10km e prepare sua primeira meia maratona. Grátis.",
    url: "/planos-treino",
    type: "website",
  },
  twitter: {
    title: "Planos de Treino de Corrida: do Zero ao 5km, 10km e Meia",
    description: "Programas de treino semana a semana para corredores: comece do zero rumo ao 5km, evolua de 5km para 10km e prepare sua primeira meia maratona. Grátis.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
