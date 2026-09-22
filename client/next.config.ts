import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Conta Vercel em PRO (sem teto de transformações; otimização ~US$0,03). Então
    // priorizamos QUALIDADE: avif (menor download) + webp de fallback, e larguras
    // completas por dispositivo. O Vercel busca o ORIGINAL no R2 1× e cacheia
    // 1 ano (minimumCacheTTL) — o R2 vira só origem, com carga mínima. Isso
    // importa porque o endereço pub-*.r2.dev tem limite de requisições: com o
    // cache de 1 ano, o R2 recebe uma visita por foto, não uma por cliente.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    qualities: [75, 90],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      // Cloudflare R2 — onde as fotos passaram a morar em 22/09/2026, quando a
      // Cloudinary avisou que desativaria a conta (196% de 25 créditos) e o
      // plano pago pedia US$ 89/mês. No R2 os mesmos 2,4 GB custam centavos, e
      // saída de dados não se cobra.
      {
        protocol: "https",
        hostname: "pub-3c261fc069aa46e795f1276f1f25ed51.r2.dev",
        pathname: "/**",
      },
      // Fica: as fotos que já não existiam na Cloudinary na hora da cópia
      // continuam apontando para cá, e há URLs antigas em pedidos já feitos.
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "ctvitzzddrumphhhreht.supabase.co",
        pathname: "/**",
      },
      { protocol: "https", hostname: "source.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "ext.same-assets.com", pathname: "/**" },
      { protocol: "https", hostname: "ugc.same-assets.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
