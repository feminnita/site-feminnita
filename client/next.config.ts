import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
  // Canônico único: /categoria/[slug]. As rotas nomeadas antigas redirecionam
  // permanente (308 — permanente, equivalente a 301 para SEO) para consolidar
  // o índice antes do Google indexar duplicado.
  async redirects() {
    return [
      { source: "/lancamentos", destination: "/categoria/lancamentos", permanent: true },
      { source: "/mais-vendidos", destination: "/categoria/mais-vendidos", permanent: true },
      { source: "/promocao", destination: "/categoria/outlet", permanent: true },
    ];
  },
};

export default nextConfig;
