"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, LayoutGrid, Rows2, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";

const SORT_OPTIONS = [
  { label: "Mais Recentes", value: "recent" },
  { label: "Menor Preço", value: "price_asc" },
  { label: "Maior Preço", value: "price_desc" },
  { label: "Nome A–Z", value: "name_asc" },
];

export default function ColecaoPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [cols, setCols] = useState<3 | 4>(4);
  const [sortBy, setSortBy] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);

  const category = categoriesData.find((c) => c.slug === slug);
  const rawProducts = productsData.filter((p) => p.category === slug);

  const products = useMemo(() => {
    const arr = [...rawProducts];
    if (sortBy === "price_asc") arr.sort((a, b) => a.pixPrice - b.pixPrice);
    else if (sortBy === "price_desc") arr.sort((a, b) => b.pixPrice - a.pixPrice);
    else if (sortBy === "name_asc") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [rawProducts, sortBy]);

  if (!category) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[1400px] mx-auto px-6 py-24 text-center">
          <p className="text-gray-400 text-sm tracking-widest uppercase mb-6">Coleção não encontrada</p>
          <Link href="/" className="text-[11px] tracking-widest uppercase border border-gray-800 px-8 py-3 hover:bg-gray-800 hover:text-white transition-colors">
            Voltar para home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Banner da coleção */}
      {category.banner && (
        <div className="relative w-full overflow-hidden bg-[#f5f0eb]" style={{ aspectRatio: "16/5" }}>
          <Image src={category.banner} alt={category.name} fill className="object-cover" priority />
        </div>
      )}

      {/* Título */}
      <div className="max-w-[1400px] mx-auto px-6 pt-10 pb-4 text-center">
        <h1 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-700">
          {category.name}
        </h1>
        <p className="text-[11px] text-gray-400 mt-1">{products.length} produtos</p>
      </div>

      {/* Barra de controles */}
      <div className="border-t border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <button className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-700 hover:text-[#8C2F39]">
            <SlidersHorizontal size={14} strokeWidth={1.5} />
            Filtrar
          </button>

          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-700 hover:text-[#8C2F39]"
            >
              <ArrowUpDown size={14} strokeWidth={1.5} />
              Ordenar
              <ChevronDown size={12} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-8 bg-white border border-gray-100 shadow-sm z-20 w-44">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-[11px] tracking-wide hover:bg-gray-50 ${sortBy === opt.value ? "text-[#8C2F39]" : "text-gray-700"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setCols(3)} className={`transition-opacity ${cols === 3 ? "opacity-100" : "opacity-30"}`} title="3 colunas">
              <Rows2 size={18} strokeWidth={1.5} />
            </button>
            <button onClick={() => setCols(4)} className={`transition-opacity ${cols === 4 ? "opacity-100" : "opacity-30"}`} title="4 colunas">
              <LayoutGrid size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-[13px]">Nenhum produto nesta coleção ainda.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-4 ${cols === 3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
