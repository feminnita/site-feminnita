import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Só webp: cada (imagem × largura × formato) é uma transformação no Vercel
    // (limite Hobby = 5 mil/mês). Servir avif TAMBÉM dobra a contagem — com o
    // recadastro dos 103 (~500 imagens) isso estoura o limite. webp cobre todos
    // os navegadores atuais; avif volta quando a conta estiver em plano pago.
    formats: ["image/webp"],
    // Larguras mínimas que o layout usa: 640/828 card, 1200 galeria, 1920 hero
    // (mobile 1x cai no 640 por downscale). Menos larguras = menos transformações.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [128, 256],
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
