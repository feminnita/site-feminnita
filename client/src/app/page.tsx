import { Header } from "../components/layout/Header";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { Vitrine } from "../components/home/Vitrine";
// import { InstagramFeed } from "../components/InstagramFeed";
// import { Newsletter } from "../components/Newsletter";
import { ProductCard } from "../components/product/ProductCard";
import { HOME_SECTION_GRID } from "../components/product/productGrid";
import { getHomeBanners, getHomeSections } from "../services/bannersService";
import { fetchProducts } from "../services/productsService";
import type { StoreProduct } from "../types/product/products";
import Image from "next/image";
import Link from "next/link";

// home renderizada por request: reflete Hero/Banners/títulos na hora, sem esperar publish
export const dynamic = "force-dynamic";

// Quantos produtos uma seção CURADA pode exibir.
const SECTION_LIMIT = 8;

// Só entra na vitrine produto ATIVO e COM FOTO — evita o quadrado bege da home.
function hasPhoto(p: StoreProduct): boolean {
  return p.active !== false && Array.isArray(p.images) && p.images.length > 0;
}

async function getHomeProducts() {
  const [products, curated] = await Promise.all([
    fetchProducts({ limit: 200 }),
    getHomeSections(),
  ]);

  // Base de todas as seções (automáticas e curadas): apenas ativos com foto.
  const withPhoto = products.filter(hasPhoto);
  const byId = new Map(withPhoto.map((p) => [p.id, p]));

  // Curada: resolve os IDs NA ORDEM salva, ignorando inativo/sem foto, com limite.
  const curate = (ids: string[]): StoreProduct[] => {
    const out: StoreProduct[] = [];
    for (const id of ids) {
      const p = byId.get(id);
      if (p) out.push(p);
      if (out.length >= SECTION_LIMIT) break;
    }
    return out;
  };

  // Curadoria preenchida => usa a lista curada; senão => automático já filtrado.
  const pick = (ids: string[], auto: StoreProduct[]) =>
    ids.length ? curate(ids) : auto;

  return {
    novidades: pick(
      curated.lancamentos,
      withPhoto.filter((p) => p.isNew).slice(0, 5),
    ),
    destaques: pick(
      curated.maisVendidos,
      withPhoto.filter((p) => p.featured || p.isBestseller).slice(0, 5),
    ),
    outlet: pick(
      curated.outlet,
      withPhoto.filter((p) => p.salePrice).slice(0, 5),
    ),
  };
}

export default async function Home() {
  const [{ novidades, destaques, outlet }, homeBanners] =
    await Promise.all([getHomeProducts(), getHomeBanners()]);

  const { slides, intermediateBanner, videoSection, imageGrid, sections } =
    homeBanners;

  // Outlet: maior desconto REAL (base→sale) entre os produtos exibidos.
  // 0 = nenhum desconto calculável → subtítulo é omitido (não inventa "até X% OFF").
  const outletMaxOff = outlet.reduce((max, p) => {
    if (p.salePrice && p.price > 0 && p.salePrice < p.price) {
      return Math.max(max, (p.price - p.salePrice) / p.price);
    }
    return max;
  }, 0);
  const outletOffPct = Math.round(outletMaxOff * 100);

  return (
    <div className="min-h-screen">
      <Header />
      <HeroCarousel slides={slides} />
      {/* Newsletter */}
      {/* <Newsletter /> */}

      {/* Lançamentos — omite a seção se não sobrar produto com foto */}
      {novidades.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="mb-12 text-center text-3xl font-light">{sections.lancamentos}</h2>
          <div className={HOME_SECTION_GRID}>
            {novidades.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Banner Intermediário — clicável, com overlay editável no painel */}
      {intermediateBanner && (
        <section className="w-full bg-gray-200">
          <Link
            href={
              intermediateBanner.href && intermediateBanner.href !== "/blusas"
                ? intermediateBanner.href
                : "/categoria/blusa"
            }
            className="group relative block cursor-pointer overflow-hidden"
          >
            <img
              src={intermediateBanner.src}
              alt={intermediateBanner.alt}
              className="block h-auto w-full transition-transform duration-500 group-hover:scale-105"
            />
            {/* gradiente direcional só na base (mesma regra do hero) — sem véu chapado, preserva a arte */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            {/* texto ancorado embaixo à esquerda, não centralizado por cima das modelos */}
            <div className="absolute inset-0 flex flex-col items-start justify-end gap-3 p-6 text-left md:p-10">
              <h2 className="text-3xl font-semibold tracking-wide text-white drop-shadow md:text-4xl">
                {intermediateBanner.title || "BLUSAS FEMININAS"}
              </h2>
              <p className="max-w-xl text-sm text-white/90 drop-shadow md:text-lg">
                {intermediateBanner.subtitle ||
                  "Atacado direto da fábrica · pedido mínimo R$ 199"}
              </p>
              <span className="mt-1 inline-block rounded-full bg-[#8C2F39] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-colors group-hover:bg-[#7a2832] md:text-base">
                {intermediateBanner.ctaText || "VER BLUSAS →"}
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Mais Vendidos — omite a seção se não sobrar produto com foto */}
      {destaques.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="mb-12 text-center text-3xl font-light">{sections.maisVendidos}</h2>
          <div className={HOME_SECTION_GRID}>
            {destaques.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Grid de Imagens — faixa de borda a borda.
          aspect-[3/4] = proporção da origem: object-cover não corta cabeça.
          gap-0 + sem rounded = coladas. Colunas DERIVADAS da quantidade ativa:
          desktop = N (teto 6); mobile = 2, e se ímpar a última ocupa as duas. */}
      {imageGrid.images.length > 0 && (
        <section className="w-full py-8">
          <div
            className={`grid grid-cols-2 gap-0 ${
              {
                1: "md:grid-cols-1",
                2: "md:grid-cols-2",
                3: "md:grid-cols-3",
                4: "md:grid-cols-4",
                5: "md:grid-cols-5",
                6: "md:grid-cols-6",
              }[Math.min(imageGrid.images.length, 6)] ?? "md:grid-cols-6"
            }`}
          >
            {imageGrid.images.map((img, i) => {
              const isLastOdd =
                imageGrid.images.length % 2 === 1 &&
                i === imageGrid.images.length - 1;
              const cls = `group relative block aspect-[3/4] overflow-hidden ${
                isLastOdd ? "col-span-2 md:col-span-1" : ""
              }`;
              const inner = (
                <>
                  <Image
                    src={img.src}
                    alt={img.alt || img.title || ""}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={90}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* scrim SÓ na base (~40%), não véu chapado — preserva a arte */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  {/* título é elemento do DOM, NUNCA embutido na imagem; ancorado embaixo à esquerda */}
                  <div className="pointer-events-none absolute bottom-0 left-0 p-4 md:p-6">
                    {img.title && (
                      <span className="block text-lg font-bold uppercase tracking-wide text-white drop-shadow md:text-xl">
                        {img.title}
                      </span>
                    )}
                    {/* a compradora não sabe que o bloco direciona — sempre mostrar, abaixo do título */}
                    <span className="mt-1 block text-sm text-white/90 drop-shadow">
                      Clique aqui →
                    </span>
                  </div>
                </>
              );
              return img.href ? (
                <Link key={i} href={img.href} className={`${cls} cursor-pointer`}>
                  {inner}
                </Link>
              ) : (
                <div key={i} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Outlet — renderiza com >= 1 produto (com foto); subtítulo = desconto REAL, senão omitido */}
      {outlet.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-light">{sections.outlet}</h2>
            {outletOffPct > 0 && (
              <p className="text-xl font-semibold text-red-600">
                até {outletOffPct}% OFF
              </p>
            )}
          </div>
          <div className={HOME_SECTION_GRID}>
            {outlet.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

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
                Pijamas e moda íntima feminina — atacado direto da fábrica,
                pedido mínimo R$ 199.
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
