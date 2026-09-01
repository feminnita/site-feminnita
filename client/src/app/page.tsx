import { Header } from "../components/layout/Header";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { Vitrine } from "../components/home/Vitrine";
// import { InstagramFeed } from "../components/InstagramFeed";
// import { Newsletter } from "../components/Newsletter";
import { ProductCard } from "../components/product/ProductCard";
import { getHomeBanners } from "../services/bannersService";
import { fetchProducts } from "../services/productsService";
import Image from "next/image";
import Link from "next/link";

// home renderizada por request: reflete Hero/Banners/títulos na hora, sem esperar publish
export const dynamic = "force-dynamic";

async function getHomeProducts() {
  const products = await fetchProducts({ limit: 20 });

  return {
    novidades: products.filter((p) => p.isNew).slice(0, 4),
    destaques: products
      .filter((p) => p.featured || p.isBestseller)
      .slice(0, 4),
    outlet: products.filter((p) => p.salePrice).slice(0, 4),
    all: products.slice(0, 8),
  };
}

export default async function Home() {
  const [{ novidades, destaques, outlet, all }, homeBanners] =
    await Promise.all([getHomeProducts(), getHomeBanners()]);

  const { slides, intermediateBanner, videoSection, imageGrid, sections } =
    homeBanners;

  return (
    <div className="min-h-screen">
      <Header />
      <HeroCarousel slides={slides} />
      {/* Newsletter */}
      {/* <Newsletter /> */}

      {/* Lançamentos */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-light">{sections.lancamentos}</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(novidades.length ? novidades : all.slice(0, 4)).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Banner Intermediário */}
      {intermediateBanner && (
        <section className="w-full bg-gray-200">
          {intermediateBanner.href ? (
            <Link href={intermediateBanner.href} className="block">
              <img
                src={intermediateBanner.src}
                alt={intermediateBanner.alt}
                className="block h-auto w-full"
              />
            </Link>
          ) : (
            <img
              src={intermediateBanner.src}
              alt={intermediateBanner.alt}
              className="block h-auto w-full"
            />
          )}
        </section>
      )}

      {/* Mais Vendidos */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-light">{sections.maisVendidos}</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(destaques.length ? destaques : all.slice(0, 4)).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Grid de Imagens */}
      {imageGrid.images.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {imageGrid.images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outlet */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-light">{sections.outlet}</h2>
          <p className="text-xl font-semibold text-red-600">{sections.outletSubtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(outlet.length ? outlet : all.slice(0, 4)).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/*VIDEO*/}
      {videoSection && <Vitrine videoSection={videoSection} />}

      {/* Instagram Feed */}
      {/* <InstagramFeed /> */}

      {/* rodapé agora é o <Footer /> global no layout.tsx (removido o inline p/ não duplicar) */}
    </div>
  );
}
