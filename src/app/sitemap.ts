import { MetadataRoute } from "next";

const BASE_URL = "https://feminnita.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/produtos`, priority: 0.9, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/sobre`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/login`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${BASE_URL}/cadastro`, priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return staticRoutes.map((route) => ({
    url: route.url,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
