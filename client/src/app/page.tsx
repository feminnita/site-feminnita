import { Header } from "../components/layout/Header";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { Vitrine } from "../components/home/Vitrine";
// import { InstagramFeed } from "../components/InstagramFeed";
// import { Newsletter } from "../components/Newsletter";
import { ProductCard } from "../components/product/ProductCard";
import { HOME_SECTION_GRID } from "../components/product/productGrid";
import { getHomeBanners } from "../services/bannersService";
import { fetchProducts } from "../services/productsService";
import type { StoreProduct } from "../types/product/products";
import Link from "next/link";

// home renderizada por request: reflete Hero/Banners/títulos na hora, sem esperar publish
export const dynamic = "force-dynamic";

// Só entra na vitrine produto ATIVO e COM FOTO — evita o quadrado bege da home.
function hasPhoto(p: StoreProduct): boolean {
  return p.active !== false && Array.isArray(p.images) && p.images.length > 0;
}

async function getHomeProducts() {
  // Cada fileira sai de um MARCADOR (flag) do produto: is_new / is_bestseller /
  // is_outlet. As categorias homônimas foram desativadas — a fileira nasce e some
  // sozinha conforme a cliente marca a flag, sem depender de home_section_categories.
  const fromFlag = async (
    flag: "is_new" | "is_bestseller" | "is_outlet",
  ): Promise<StoreProduct[]> => {
    const products = await fetchProducts({ flag, limit: 30 });
    return products.filter(hasPhoto).slice(0, 5);
  };

  const [novidades, destaques, outlet] = await Promise.all([
    fromFlag("is_new"),
    fromFlag("is_bestseller"),
    fromFlag("is_outlet"),
  ]);

  return { novidades, destaques, outlet };
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
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet={intermediateBanner.src}
              />
              <img
                src={intermediateBanner.srcMobile || intermediateBanner.src}
                alt={intermediateBanner.alt}
                className="block h-auto w-full transition-transform duration-500 group-hover:scale-105"
              />
            </picture>
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
                  <picture>
                    <source media="(min-width: 768px)" srcSet={img.src} />
                    <img
                      src={img.srcMobile || img.src}
                      alt={img.alt || img.title || ""}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </picture>
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

      {/* Footer agora é global (renderizado no ClientBody) — não duplicar aqui */}
    </div>
  );
}
