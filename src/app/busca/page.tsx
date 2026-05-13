"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Grid2X2, Grid3X3, LayoutGrid, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import productsData from "@/data/products.json";

const CATEGORIAS = ["Pijamas", "Camisolas", "Shorts Doll", "Conjuntos", "Outlet"];
const TAMANHOS   = ["PP", "P", "M", "G", "GG", "XGG"];

type SortKey = "relevancia" | "menor-preco" | "maior-preco" | "lancamentos";

function BuscaContent() {
  const searchParams   = useSearchParams();
  const initialQuery   = searchParams.get("q") || "";

  const [query,        setQuery]        = useState(initialQuery);
  const [inputVal,     setInputVal]     = useState(initialQuery);
  const [catFiltros,   setCatFiltros]   = useState<string[]>([]);
  const [tamFiltros,   setTamFiltros]   = useState<string[]>([]);
  const [sort,         setSort]         = useState<SortKey>("relevancia");
  const [cols,         setCols]         = useState<2 | 3 | 4>(4);
  const [sideOpen,     setSideOpen]     = useState(false);

  /* ── Filtrar + ordenar ── */
  const results = (() => {
    let list = productsData.filter(p => {
      const q = query.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) &&
               !p.code.toLowerCase().includes(q) &&
               !p.category.toLowerCase().includes(q)) return false;
      if (catFiltros.length && !catFiltros.some(c => p.category.toLowerCase() === c.toLowerCase())) return false;
      if (tamFiltros.length && !tamFiltros.some(t => p.sizes?.includes(t))) return false;
      return true;
    });
    if (sort === "menor-preco")  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "maior-preco")  list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "lancamentos")  list = [...list].reverse();
    return list;
  })();

  const totalFiltros = catFiltros.length + tamFiltros.length;

  const toggleCat = (v: string) => setCatFiltros(f => f.includes(v) ? f.filter(x => x !== v) : [...f, v]);
  const toggleTam = (v: string) => setTamFiltros(f => f.includes(v) ? f.filter(x => x !== v) : [...f, v]);
  const clearAll  = () => { setCatFiltros([]); setTamFiltros([]); };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setQuery(inputVal.trim()); };

  const gridClass = cols === 2
    ? "grid-cols-2"
    : cols === 3
    ? "grid-cols-2 md:grid-cols-3"
    : "grid-cols-2 md:grid-cols-4";

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 pt-5 pb-2">
        <nav className="flex gap-1 text-[11px] text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-700">Busca</span>
          {query && <><span>/</span><span className="text-gray-700">"{query}"</span></>}
        </nav>
      </div>

      {/* Barra de busca */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Buscar produtos…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 text-[13px] focus:outline-none focus:border-gray-600"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gray-900 text-white text-[11px] uppercase tracking-widest hover:bg-black transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pb-16 flex gap-8">
        {/* ── Filtros sidebar (desktop) ── */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-widest font-medium text-gray-700">Filtros</span>
            {totalFiltros > 0 && (
              <button onClick={clearAll} className="text-[10px] text-[#8C2F39] underline underline-offset-2">
                Limpar ({totalFiltros})
              </button>
            )}
          </div>

          {/* Categorias */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">Categoria</p>
            {CATEGORIAS.map(c => (
              <label key={c} className="flex items-center gap-2 mb-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={catFiltros.includes(c)}
                  onChange={() => toggleCat(c)}
                  className="accent-[#8C2F39]"
                />
                <span className="text-[12px] text-gray-600 group-hover:text-gray-900">{c}</span>
              </label>
            ))}
          </div>

          {/* Tamanhos */}
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">Tamanho</p>
            <div className="flex flex-wrap gap-1.5">
              {TAMANHOS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleTam(t)}
                  className={`w-10 h-8 text-[11px] border transition-colors ${
                    tamFiltros.includes(t)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Resultados ── */}
        <div className="flex-1 min-w-0">
          {/* Barra superior: contagem + sort + grid */}
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              {/* Mobile filtros */}
              <button
                onClick={() => setSideOpen(true)}
                className="md:hidden flex items-center gap-1.5 text-[11px] uppercase tracking-widest border border-gray-300 px-3 py-1.5 hover:border-gray-600"
              >
                <SlidersHorizontal size={13} /> Filtros {totalFiltros > 0 && `(${totalFiltros})`}
              </button>
              <span className="text-[12px] text-gray-400">
                {results.length} {results.length === 1 ? "produto" : "produtos"}
                {query && ` para "${query}"`}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="text-[11px] border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-gray-500 bg-white"
              >
                <option value="relevancia">Relevância</option>
                <option value="lancamentos">Lançamentos</option>
                <option value="menor-preco">Menor Preço</option>
                <option value="maior-preco">Maior Preço</option>
              </select>

              {/* Grid toggle */}
              <div className="hidden md:flex items-center gap-1">
                <button onClick={() => setCols(2)} className={`p-1.5 ${cols === 2 ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                  <Grid2X2 size={15} />
                </button>
                <button onClick={() => setCols(3)} className={`p-1.5 ${cols === 3 ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                  <Grid3X3 size={15} />
                </button>
                <button onClick={() => setCols(4)} className={`p-1.5 ${cols === 4 ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Tags de filtros ativos */}
          {totalFiltros > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {catFiltros.map(c => (
                <button key={c} onClick={() => toggleCat(c)} className="flex items-center gap-1 text-[10px] border border-gray-300 px-2.5 py-1 hover:border-red-400 hover:text-red-500">
                  {c} <X size={10} />
                </button>
              ))}
              {tamFiltros.map(t => (
                <button key={t} onClick={() => toggleTam(t)} className="flex items-center gap-1 text-[10px] border border-gray-300 px-2.5 py-1 hover:border-red-400 hover:text-red-500">
                  {t} <X size={10} />
                </button>
              ))}
            </div>
          )}

          {/* Grid de produtos */}
          {results.length > 0 ? (
            <div className={`grid gap-4 ${gridClass}`}>
              {results.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-24">
              <Search size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-[14px] text-gray-500 mb-2">
                {query ? `Nenhum produto encontrado para "${query}"` : "Digite algo para buscar"}
              </p>
              {query && (
                <p className="text-[12px] text-gray-400 mb-8">Tente palavras diferentes ou navegue por nossas coleções</p>
              )}
              <div className="flex gap-3 justify-center">
                <Link href="/colecao/pijamas" className="text-[11px] uppercase tracking-widest border border-gray-800 px-6 py-2.5 hover:bg-gray-800 hover:text-white transition-colors">
                  Ver Pijamas
                </Link>
                <Link href="/" className="text-[11px] uppercase tracking-widest border border-gray-300 px-6 py-2.5 hover:border-gray-600 transition-colors">
                  Voltar ao início
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filtros drawer */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSideOpen(false)} />
          <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[12px] uppercase tracking-widest font-medium">Filtros</span>
              <button onClick={() => setSideOpen(false)}><X size={18} /></button>
            </div>

            {/* Categorias */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">Categoria</p>
              {CATEGORIAS.map(c => (
                <label key={c} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" checked={catFiltros.includes(c)} onChange={() => toggleCat(c)} className="accent-[#8C2F39]" />
                  <span className="text-[12px] text-gray-600">{c}</span>
                </label>
              ))}
            </div>

            {/* Tamanhos */}
            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">Tamanho</p>
              <div className="flex flex-wrap gap-1.5">
                {TAMANHOS.map(t => (
                  <button key={t} onClick={() => toggleTam(t)}
                    className={`w-10 h-8 text-[11px] border transition-colors ${tamFiltros.includes(t) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-600"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSideOpen(false)}
              className="w-full bg-gray-900 text-white text-[11px] uppercase tracking-widest py-3 hover:bg-black transition-colors"
            >
              Ver {results.length} resultados
            </button>
            {totalFiltros > 0 && (
              <button onClick={clearAll} className="w-full mt-2 text-[11px] text-gray-500 underline py-2">
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function BuscaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Search size={28} className="animate-pulse text-gray-300" />
      </div>
    }>
      <BuscaContent />
    </Suspense>
  );
}
