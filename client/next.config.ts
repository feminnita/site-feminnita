import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Conta Vercel em PRO (sem teto de transformações; otimização ~US$0,03). Então
    // priorizamos QUALIDADE: avif (menor download) + webp de fallback, e larguras
    // completas por dispositivo. O Vercel busca o ORIGINAL na Cloudinary 1× e cacheia
    // 1 ano (minimumCacheTTL) — a Cloudinary vira só origem, com carga mínima.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    qualities: [75, 90],
    minimumCacheTTL: 31536000,
    remotePatterns: [
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
