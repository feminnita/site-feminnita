import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Enxuto para o mínimo que o layout usa: 390 mobile, 640/828 card, 1200
    // galeria, 1920 hero. Cada largura × formato é uma transformação de imagem
    // (no Vercel) — menos larguras = menos otimizações e menos bytes servidos.
    deviceSizes: [390, 640, 828, 1200, 1920],
    imageSizes: [64, 128, 256],
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
