import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import productsData from "@/data/products.json";

const colecoes = [
  { nome: "PIJAMAS", href: "/colecao/pijamas", img: "/colecoes/pijamas.jpg" },
  { nome: "CAMISOLAS", href: "/colecao/camisolas", img: "/colecoes/camisolas.jpg" },
  { nome: "SHORTS DOLL", href: "/colecao/shorts-doll", img: "/colecoes/shorts.jpg" },
  { nome: "CONJUNTOS", href: "/colecao/conjuntos", img: "/colecoes/conjuntos.jpg" },
  { nome: "OUTLET", href: "/colecao/outlet", img: "/colecoes/outlet.jpg" },
];

export default function Home() {
  const lancamentos = productsData.slice(0, 4);
  const maisVendidos = productsData.slice(0, 8);
  const outlet = productsData.slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Coleções — tiles com imagem */}
      <section className="max-w-[1400px] mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {colecoes.map((col) => (
            <Link key={col.nome} href={col.href} className="group block">
              <div className="relative overflow-hidden bg-[#f5f0eb]" style={{ aspectRatio: "2/3" }}>
                <Image
                  src={col.img}
                  alt={col.nome}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                <span className="absolute bottom-4 left-0 right-0 text-center text-white text-[11px] font-semibold tracking-widest">
                  {col.nome}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Lançamentos */}
      <section className="max-w-[1400px] mx-auto px-4 py-10">
        <h2 className="text-center text-[13px] font-light tracking-[0.3em] uppercase text-gray-700 mb-8">
          lançamentos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lancamentos.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/colecao/pijamas"
            className="inline-block border border-gray-800 text-gray-800 text-[11px] tracking-widest uppercase px-10 py-3 hover:bg-gray-800 hover:text-white transition-colors duration-300"
          >
            Ver todos
          </Link>
        </div>
      </section>

      {/* Banner intermediário */}
      <section className="relative w-full overflow-hidden" style={{ aspectRatio: "16/5" }}>
        <Link href="/colecao/conjuntos">
          <Image
            src="/banners/banner-colecao.jpg"
            alt="Conjuntos Feminnita"
            fill
            className="object-cover hover:scale-[1.02] transition-transform duration-700"
          />
        </Link>
      </section>

      {/* Mais vendidos */}
      <section className="max-w-[1400px] mx-auto px-4 py-10">
        <h2 className="text-center text-[13px] font-light tracking-[0.3em] uppercase text-gray-700 mb-8">
          mais vendidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {maisVendidos.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Banner outlet */}
      <section className="bg-[#8C2F39] py-12 text-white text-center">
        <p className="text-[11px] tracking-[0.4em] uppercase mb-2">promoções especiais</p>
        <h3 className="text-3xl font-light tracking-wider mb-6">outlet</h3>
        <p className="text-lg font-light mb-8">até 50% OFF</p>
        <Link
          href="/colecao/outlet"
          className="inline-block border border-white text-white text-[11px] tracking-widest uppercase px-10 py-3 hover:bg-white hover:text-[#8C2F39] transition-colors duration-300"
        >
          Ver promoções
        </Link>
      </section>

      {/* Outlet produtos */}
      <section className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {outlet.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Instagram strip placeholder */}
      <section className="max-w-[1400px] mx-auto px-4 py-10 border-t border-gray-100">
        <p className="text-center text-[11px] tracking-[0.4em] uppercase text-gray-500 mb-8">
          @feminnita
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative bg-[#f5f0eb]" style={{ aspectRatio: "1/1" }}>
              <Image
                src={`/instagram/${i + 1}.jpg`}
                alt={`Instagram ${i + 1}`}
                fill
                className="object-cover hover:opacity-80 transition-opacity"
              />
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
