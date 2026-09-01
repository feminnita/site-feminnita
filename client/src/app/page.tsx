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

export const revalidate = 60;

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

  const { slides, intermediateBanner, videoSection, imageGrid } = homeBanners;

  return (
    <div className="min-h-screen">
      <Header />
      <HeroCarousel slides={slides} />
      {/* Newsletter */}
      {/* <Newsletter /> */}

      {/* Lançamentos */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-light">Lançamentos</h2>
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
        <h2 className="mb-12 text-center text-3xl font-light">Mais Vendidos</h2>
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
          <h2 className="mb-2 text-3xl font-light">Outlet</h2>
          <p className="text-xl font-semibold text-red-600">até 50% OFF</p>
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

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-xl font-bold">Feminnita</h3>
              <p className="text-sm text-gray-600">
                Moda fitness feminina com design inovador e qualidade
                excepcional
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Institucional</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/sobre" className="hover:underline">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/contato" className="hover:underline">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="hover:underline">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="hover:underline">
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Minha Conta</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/minha-conta" className="hover:underline">
                    Meus Pedidos
                  </Link>
                </li>
                <li>
                  <Link href="/favoritos" className="hover:underline">
                    Favoritos
                  </Link>
                </li>
                <li>
                  <Link href="/comparar" className="hover:underline">
                    Comparar Produtos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Atendimento</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>WhatsApp: (22) 99281-0707</li>
                <li>Email: feminnita@gmail.com</li>
                <li>Seg-Quin: 8h às 17hs</li>
                <li>Sext: 8h às 16hs</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2026 Feminnita. Todos os direitos reservados.
            </p>
            <div className="mt-4 flex justify-center gap-6">
              <a
                href="https://www.facebook.com/feminnita/"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/feminnita/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
