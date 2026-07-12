import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compartilhar Resultado de Corrida em Imagem para Stories",
  description: "Gere uma imagem com seus dados de treino para compartilhar nos Stories, Instagram e WhatsApp. Mostre seu pace, distância e tempo com estilo.",
  alternates: { canonical: "/compartilhar-resultado" },
  openGraph: {
    title: "Compartilhar Resultado de Corrida em Imagem para Stories",
    description: "Gere uma imagem com seus dados de treino para compartilhar nos Stories, Instagram e WhatsApp. Mostre seu pace, distância e tempo com estilo.",
    url: "/compartilhar-resultado",
    type: "website",
  },
  twitter: {
    title: "Compartilhar Resultado de Corrida em Imagem para Stories",
    description: "Gere uma imagem com seus dados de treino para compartilhar nos Stories, Instagram e WhatsApp. Mostre seu pace, distância e tempo com estilo.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
