import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Pace: Ritmo, Tempo e Distância de Corrida",
  description: "Calcule seu pace, tempo de prova ou distância. Previsão de tempo para 1km, 5km, 10km, meia maratona e maratona. Grátis e sem cadastro.",
  alternates: { canonical: "/calculadora-pace" },
  openGraph: {
    title: "Calculadora de Pace: Ritmo, Tempo e Distância de Corrida",
    description: "Calcule seu pace, tempo de prova ou distância. Previsão de tempo para 1km, 5km, 10km, meia maratona e maratona. Grátis e sem cadastro.",
    url: "/calculadora-pace",
    type: "website",
  },
  twitter: {
    title: "Calculadora de Pace: Ritmo, Tempo e Distância de Corrida",
    description: "Calcule seu pace, tempo de prova ou distância. Previsão de tempo para 1km, 5km, 10km, meia maratona e maratona. Grátis e sem cadastro.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: `{"@context":"https://schema.org","@type":"WebApplication","name":"Calculadora de Pace — Moda Run","applicationCategory":"HealthApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0","priceCurrency":"BRL"},"description":"Calcule pace, tempo e distância de corrida para 5km, 10km, meia e maratona."}` }}
      />
      {children}
    </>
  );
}
