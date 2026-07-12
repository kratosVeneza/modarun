import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Treinos em Grupo: Encontre Corredores na Sua Cidade",
  description: "Crie ou participe de treinos em grupo. Marque o ponto de largada no mapa, defina pace e distância e corra com outros corredores da sua cidade.",
  alternates: { canonical: "/encontros" },
  openGraph: {
    title: "Treinos em Grupo: Encontre Corredores na Sua Cidade",
    description: "Crie ou participe de treinos em grupo. Marque o ponto de largada no mapa, defina pace e distância e corra com outros corredores da sua cidade.",
    url: "/encontros",
    type: "website",
  },
  twitter: {
    title: "Treinos em Grupo: Encontre Corredores na Sua Cidade",
    description: "Crie ou participe de treinos em grupo. Marque o ponto de largada no mapa, defina pace e distância e corra com outros corredores da sua cidade.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
