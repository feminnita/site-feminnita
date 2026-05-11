/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  allowedDevOrigins: ["*.preview.same-app.com"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "source.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "ext.same-assets.com", pathname: "/**" },
      { protocol: "https", hostname: "ugc.same-assets.com", pathname: "/**" },
      { protocol: "https", hostname: "ctvitzzddrumphhhreht.supabase.co", pathname: "/**" },
    ],
  },
};

module.exports = nextConfig;
