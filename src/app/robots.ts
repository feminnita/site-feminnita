import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/pedido-confirmado"],
      },
    ],
    sitemap: "https://feminnita.com.br/sitemap.xml",
  };
}
