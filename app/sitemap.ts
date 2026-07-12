import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://modarun.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Rotas públicas e indexáveis. Prioridade mais alta nas ferramentas
  // (iscas de SEO) e nas páginas de descoberta (eventos, encontros, loja).
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/ferramentas", priority: 0.9, changeFrequency: "weekly" },
    { path: "/calculadora-pace", priority: 0.9, changeFrequency: "monthly" },
    { path: "/calculadora-fc", priority: 0.9, changeFrequency: "monthly" },
    { path: "/planos-treino", priority: 0.9, changeFrequency: "monthly" },
    { path: "/compartilhar-resultado", priority: 0.7, changeFrequency: "monthly" },
    { path: "/eventos", priority: 0.8, changeFrequency: "daily" },
    { path: "/encontros", priority: 0.8, changeFrequency: "daily" },
    { path: "/loja", priority: 0.8, changeFrequency: "weekly" },
    { path: "/cadastro", priority: 0.6, changeFrequency: "yearly" },
    { path: "/login", priority: 0.4, changeFrequency: "yearly" },
    { path: "/contato", priority: 0.3, changeFrequency: "yearly" },
    { path: "/politica-de-privacidade", priority: 0.2, changeFrequency: "yearly" },
    { path: "/termos-de-uso", priority: 0.2, changeFrequency: "yearly" },
    { path: "/politica-de-cookies", priority: 0.2, changeFrequency: "yearly" },
    { path: "/diretrizes-da-comunidade", priority: 0.2, changeFrequency: "yearly" },
    { path: "/exclusao-de-conta", priority: 0.2, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
