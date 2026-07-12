import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Histórico de Treinos: Acompanhe Sua Evolução na Corrida",
  description: "Registre suas corridas e acompanhe sua evolução com gráficos de distância, tempo e frequência cardíaca ao longo das semanas.",
  alternates: { canonical: "/historico" },
  openGraph: {
    title: "Histórico de Treinos: Acompanhe Sua Evolução na Corrida",
    description: "Registre suas corridas e acompanhe sua evolução com gráficos de distância, tempo e frequência cardíaca ao longo das semanas.",
    url: "/historico",
    type: "website",
  },
  twitter: {
    title: "Histórico de Treinos: Acompanhe Sua Evolução na Corrida",
    description: "Registre suas corridas e acompanhe sua evolução com gráficos de distância, tempo e frequência cardíaca ao longo das semanas.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
