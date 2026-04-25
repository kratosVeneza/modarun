import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://modarun.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Moda Run — Running & Performance",
    template: "%s | Moda Run",
  },
  description: "Encontre treinos em grupo, eventos de corrida e equipamentos para corredores. A comunidade de corrida do Brasil.",
  keywords: ["corrida", "running", "treino", "maratona", "5km", "10km", "corrida em grupo", "eventos de corrida", "moda run"],
  authors: [{ name: "Moda Run" }],
  creator: "Moda Run",
  publisher: "Moda Run",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Moda Run",
    title: "Moda Run — Running & Performance",
    description: "Encontre treinos em grupo, eventos de corrida e equipamentos para corredores.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Moda Run — Running & Performance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moda Run — Running & Performance",
    description: "Encontre treinos em grupo, eventos de corrida e equipamentos para corredores.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
