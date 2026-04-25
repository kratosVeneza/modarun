import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Moda Run",
  description: "App de corridas, encontros e produtos da Moda Run",
  icons: {
    icon: "/favicon.ico",
  },
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

