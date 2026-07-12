import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Zonas de Frequência Cardíaca (Z1–Z5)",
  description: "Descubra suas zonas de treino Z1 a Z5 pela idade e FC de repouso. Métodos Tanaka, clássico e Karvonen. Calcule sua frequência cardíaca máxima grátis.",
  alternates: { canonical: "/calculadora-fc" },
  openGraph: {
    title: "Calculadora de Zonas de Frequência Cardíaca (Z1–Z5)",
    description: "Descubra suas zonas de treino Z1 a Z5 pela idade e FC de repouso. Métodos Tanaka, clássico e Karvonen. Calcule sua frequência cardíaca máxima grátis.",
    url: "/calculadora-fc",
    type: "website",
  },
  twitter: {
    title: "Calculadora de Zonas de Frequência Cardíaca (Z1–Z5)",
    description: "Descubra suas zonas de treino Z1 a Z5 pela idade e FC de repouso. Métodos Tanaka, clássico e Karvonen. Calcule sua frequência cardíaca máxima grátis.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: `{"@context":"https://schema.org","@type":"WebApplication","name":"Calculadora de Zonas de FC — Moda Run","applicationCategory":"HealthApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0","priceCurrency":"BRL"},"description":"Calcule zonas de frequência cardíaca Z1-Z5 (Tanaka, Karvonen) para corrida."}` }}
      />
      {children}
    </>
  );
}
