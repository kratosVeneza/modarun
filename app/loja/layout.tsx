import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loja Moda Run: Roupas e Acessórios para Corredores",
  description: "Camisetas, regatas e acessórios Moda Run para corredores. Vista a comunidade de corrida e corra na moda.",
  alternates: { canonical: "/loja" },
  openGraph: {
    title: "Loja Moda Run: Roupas e Acessórios para Corredores",
    description: "Camisetas, regatas e acessórios Moda Run para corredores. Vista a comunidade de corrida e corra na moda.",
    url: "/loja",
    type: "website",
  },
  twitter: {
    title: "Loja Moda Run: Roupas e Acessórios para Corredores",
    description: "Camisetas, regatas e acessórios Moda Run para corredores. Vista a comunidade de corrida e corra na moda.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
