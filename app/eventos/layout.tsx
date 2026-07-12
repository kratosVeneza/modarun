import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eventos e Corridas de Rua no Brasil: Calendário de Provas",
  description: "Encontre corridas de rua, maratonas e provas de 5km e 10km perto de você. Calendário de eventos de corrida no Brasil com link de inscrição.",
  alternates: { canonical: "/eventos" },
  openGraph: {
    title: "Eventos e Corridas de Rua no Brasil: Calendário de Provas",
    description: "Encontre corridas de rua, maratonas e provas de 5km e 10km perto de você. Calendário de eventos de corrida no Brasil com link de inscrição.",
    url: "/eventos",
    type: "website",
  },
  twitter: {
    title: "Eventos e Corridas de Rua no Brasil: Calendário de Provas",
    description: "Encontre corridas de rua, maratonas e provas de 5km e 10km perto de você. Calendário de eventos de corrida no Brasil com link de inscrição.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
