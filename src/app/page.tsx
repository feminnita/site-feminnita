import Link from "next/link";
import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import productsData from "@/data/products.json";

const categorias = [
  { nome: "Pijamas", href: "/colecao/pijamas", bg: "linear-gradient(160deg,#f5ece6,#e0cfc6)", textColor: "#5a3a2e" },
  { nome: "Camisolas", href: "/colecao/camisolas", bg: "linear-gradient(160deg,#f0ebe8,#d8c9c0)", textColor: "#4a3028" },
  { nome: "Shorts Doll", href: "/colecao/shorts-doll", bg: "linear-gradient(160deg,#fdf6f0,#eaddd3)", textColor: "#5a3a2e" },
  { nome: "Conjuntos", href: "/colecao/conjuntos", bg: "linear-gradient(160deg,#2e1a20,#8C2F39)", textColor: "#fff" },
];

export default function Home() {
  const pijamas    = productsData.filter((p) => p.category === "pijamas");
  const camisolas  = productsData.filter((p) => p.category === "camisolas");
  const lancamentos = [...pijamas, ...camisolas].slice(0, 4);
  const maisVendidos = productsData.slice(0, 8);
  const outlet = productsData.filter((p) => p.category === "outlet").slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* 1. HERO */}
      <HeroCarousel />

      {/* 2. CARROSSEL PIJAMAS */}
      {pijamas.length > 0 && (
        <ProductCarousel products={pijamas} title="Pijamas" bg="#faf7f4" />
      )}

      {/* 3. ÚLTIMOS LANÇAMENTOS */}
      <section className="py-12" style={{ background: "#fff" }}>
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-center text-[13px] font-light tracking-[0.3em] uppercase text-gray-600 mb-10">
            Últimos Lançamentos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {lancamentos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/colecao/lancamentos"
              className="inline-block border border-gray-800 text-[11px] tracking-widest uppercase px-10 py-3 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Ver todos os lançamentos
            </Link>
          </div>
        </div>
      </section>

      {/* Banner conjuntos */}
      <section className="max-w-[1200px] mx-auto px-4 pb-10">
        <Link
          href="/colecao/conjuntos"
          className="group flex items-center justify-center overflow-hidden relative"
          style={{ aspectRatio: "16/5", background: "linear-gradient(135deg,#2e1a20 0%,#8C2F39 60%,#6b2330 100%)" }}
        >
          <div className="text-center text-white">
            <p className="text-[10px] uppercase tracking-[0.5em] opacity-60 mb-3">nova coleção</p>
            <h3 className="text-3xl md:text-4xl font-extralight tracking-wider mb-6" style={{ fontFamily: "serif" }}>
              Conjuntos
            </h3>
            <span className="text-[11px] uppercase tracking-[0.3em] border border-white/50 px-10 py-3 group-hover:bg-white group-hover:text-[#8C2F39] transition-colors duration-300">
              Ver Conjuntos
            </span>
          </div>
        </Link>
      </section>

      {/* 4. MAIS VENDIDOS */}
      <section className="py-12" style={{ background: "#fafafa" }}>
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-center text-[13px] font-light tracking-[0.3em] uppercase text-gray-600 mb-10">
            Mais Vendidos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {maisVendidos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Grade de categorias */}
      <section className="py-12" style={{ background: "#fff" }}>
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categorias.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group relative overflow-hidden flex items-end"
                style={{ aspectRatio: "3/4", background: cat.bg, borderRadius: 8 }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "rgba(0,0,0,0.1)" }}
                />
                <div className="relative p-5 w-full">
                  <span
                    className="text-[12px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: cat.textColor }}
                  >
                    {cat.nome}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Banner destaque */}
      <section
        className="w-full flex flex-col items-center justify-center text-white text-center px-6"
        style={{ aspectRatio: "16/6", background: "linear-gradient(135deg,#1a0d10 0%,#8C2F39 50%,#5a1e27 100%)" }}
      >
        <p className="text-[10px] tracking-[0.5em] uppercase opacity-60 mb-3">feminnita</p>
        <h3 className="text-3xl md:text-5xl font-extralight tracking-wider mb-6" style={{ fontFamily: "serif" }}>
          Dormir bem é se amar
        </h3>
        <Link
          href="/colecao/pijamas"
          className="border border-white/50 text-white text-[11px] tracking-[0.3em] uppercase px-10 py-3 hover:bg-white hover:text-[#8C2F39] transition-colors duration-300"
        >
          Ver Coleção
        </Link>
      </section>

      {/* 5. CARROSSEL CAMISOLAS */}
      {camisolas.length > 0 && (
        <ProductCarousel products={camisolas} title="Camisolas" bg="#faf7f4" />
      )}

      {/* 6. OUTLET */}
      {outlet.length > 0 && (
        <section className="py-12 border-t border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-600">Outlet</h2>
              <span className="text-[12px] font-medium tracking-wide" style={{ color: "#8C2F39" }}>
                até 50% OFF
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {outlet.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/colecao/outlet"
                className="inline-block border border-gray-800 text-[11px] tracking-widest uppercase px-10 py-3 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Ver todas as promoções
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Instagram */}
      <section className="border-t border-gray-100 py-10 text-center">
        <a
          href="https://instagram.com/feminnita"
          target="_blank"
          rel="noopener"
          className="text-[11px] tracking-[0.4em] uppercase text-gray-400 hover:text-[#8C2F39] transition-colors"
        >
          @feminnita
        </a>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
