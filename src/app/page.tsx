import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import productsData from "@/data/products.json";

/* Banners temporários — substituir pelas fotos da Feminnita */
const BANNER_MAIN   = "https://ext.same-assets.com/2738959979/2302845870.webp";
const BANNER_MAIN2  = "https://ext.same-assets.com/2738959979/1774049605.webp";
const BANNER_CAT1   = "https://ext.same-assets.com/2738959979/254087678.webp";
const BANNER_CAT2   = "https://ext.same-assets.com/2738959979/962659951.webp";
const BANNER_CAT3   = "https://ext.same-assets.com/2738959979/4171673573.webp";
const BANNER_CAT4   = "https://ext.same-assets.com/2738959979/1709762124.webp";

const colecoes = [
  { nome: "PIJAMAS",      href: "/colecao/pijamas",     img: BANNER_CAT1, banner: BANNER_MAIN },
  { nome: "CAMISOLAS",    href: "/colecao/camisolas",   img: BANNER_CAT2, banner: BANNER_MAIN2 },
  { nome: "SHORTS DOLL",  href: "/colecao/shorts-doll", img: BANNER_CAT3, banner: BANNER_MAIN },
  { nome: "CONJUNTOS",    href: "/colecao/conjuntos",   img: BANNER_CAT4, banner: BANNER_MAIN2 },
  { nome: "OUTLET",       href: "/colecao/outlet",      img: BANNER_CAT1, banner: BANNER_MAIN },
];

const categoriasBanners = [
  { label: "Pijamas",      href: "/colecao/pijamas",     img: BANNER_CAT1 },
  { label: "Camisolas",    href: "/colecao/camisolas",   img: BANNER_CAT2 },
  { label: "Shorts Doll",  href: "/colecao/shorts-doll", img: BANNER_CAT3 },
  { label: "Conjuntos",    href: "/colecao/conjuntos",   img: BANNER_CAT4 },
];

export default function Home() {
  const todos     = productsData;
  const pijamas   = productsData.filter(p => p.category === "pijamas");
  const camisolas = productsData.filter(p => p.category === "camisolas");
  const lancamentos = [...pijamas, ...camisolas].slice(0, 8);
  const maisVendidos = [...todos].slice(0, 8);
  const outlet    = productsData.filter(p => p.category === "outlet").slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── 1. HERO CAROUSEL ── */}
      <HeroCarousel />

      {/* ── 2. COLEÇÃO DESTAQUE com carrossel de produtos ── */}
      {pijamas.length > 0 && (
        <ProductCarousel
          products={pijamas}
          logoText="Pijamas"
          logoBg="#f5f0eb"
        />
      )}

      {/* ── 3. ÚLTIMOS LANÇAMENTOS ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-10">
        <h2 className="text-center text-[13px] font-light tracking-[0.3em] uppercase text-gray-700 mb-8">
          Últimos Lançamentos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lancamentos.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Banner secundário */}
      <section className="max-w-[1400px] mx-auto px-6 pb-10">
        <Link href="/colecao/conjuntos" className="block relative overflow-hidden" style={{ aspectRatio: "16/5" }}>
          <Image src={BANNER_MAIN2} alt="Conjuntos Feminnita" fill className="object-cover hover:scale-[1.02] transition-transform duration-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white/80 text-gray-900 text-[11px] uppercase tracking-widest px-8 py-3 hover:bg-white transition-colors">
              Ver Conjuntos
            </span>
          </div>
        </Link>
      </section>

      {/* ── 4. MAIS VENDIDOS ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-10">
        <h2 className="text-center text-[13px] font-light tracking-[0.3em] uppercase text-gray-700 mb-8">
          Mais Vendidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {maisVendidos.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* 4 banners terciários de categoria — igual Ange */}
      <section className="max-w-[1400px] mx-auto px-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoriasBanners.map(cat => (
            <Link key={cat.href} href={cat.href} className="group block relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
              <Image src={cat.img} alt={cat.label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-white text-[11px] font-semibold tracking-widest uppercase">{cat.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner de destaque / vídeo */}
      <section className="w-full relative overflow-hidden bg-[#8C2F39]" style={{ aspectRatio: "16/6" }}>
        <Image src={BANNER_MAIN} alt="Feminnita" fill className="object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <p className="text-[11px] tracking-[0.4em] uppercase mb-3">nova coleção</p>
          <h3 className="text-3xl md:text-4xl font-light tracking-wider mb-6">feminnita</h3>
          <Link
            href="/colecao/pijamas"
            className="border border-white text-white text-[11px] tracking-widest uppercase px-10 py-3 hover:bg-white hover:text-gray-900 transition-colors duration-300"
          >
            Ver Coleção
          </Link>
        </div>
      </section>

      {/* ── 5. SEGUNDA COLEÇÃO — Camisolas ── */}
      {camisolas.length > 0 && (
        <ProductCarousel
          products={camisolas}
          logoText="Camisolas"
          logoBg="#faf7f4"
        />
      )}

      {/* ── 6. OUTLET ── */}
      {outlet.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 py-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-700">Outlet</h2>
            <span className="text-[12px] text-[#8C2F39] font-medium">até 50% OFF</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {outlet.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/colecao/outlet" className="inline-block border border-gray-800 text-[11px] tracking-widest uppercase px-10 py-3 hover:bg-gray-800 hover:text-white transition-colors">
              Ver todas as promoções
            </Link>
          </div>
        </section>
      )}

      {/* Instagram */}
      <section className="border-t border-gray-100 py-10 text-center">
        <a href="https://instagram.com/feminnita" target="_blank" rel="noopener" className="text-[11px] tracking-[0.4em] uppercase text-gray-400 hover:text-[#8C2F39] transition-colors">
          @feminnita
        </a>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
