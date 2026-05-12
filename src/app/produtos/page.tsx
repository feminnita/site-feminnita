"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { Filter, X, Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { fetchProducts, type StoreProduct } from "@/lib/products";

// ── NLP query parser ──────────────────────────────────────────────
const COLOR_ALIASES: Record<string, string[]> = {
  rose: ["rose", "rosê", "rosa", "rosé"],
  mint: ["mint", "menta", "verde claro"],
  aloe: ["aloe", "verde"],
  hazel: ["hazel", "caramelo", "nude", "bege"],
  preto: ["preto", "preta", "black"],
  branco: ["branco", "branca", "white"],
  mescla: ["mescla", "cinza", "grey", "gray"],
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  tops: ["top", "tops", "cropped", "sutiã", "bustier"],
  leggings: ["legging", "leggings", "calça", "calças"],
  shorts: ["short", "shorts"],
  conjuntos: ["conjunto", "conjuntos", "kit", "set"],
};

const FABRIC_ALIASES: Record<string, string[]> = {
  poliamida: ["poliamida", "nylon"],
  suplex: ["suplex"],
  dry: ["dry", "dry-fit", "dryfit"],
};

type ParsedQuery = {
  text: string;
  colors: string[];
  sizes: string[];
  categories: string[];
  fabrics: string[];
};

function parseQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase();
  const colors: string[] = [];
  const sizes: string[] = [];
  const categories: string[] = [];
  const fabrics: string[] = [];

  Object.entries(COLOR_ALIASES).forEach(([key, aliases]) => {
    if (aliases.some((a) => lower.includes(a))) colors.push(key);
  });

  ["pp", "p", "m", "g", "gg", "xg"].forEach((s) => {
    if (new RegExp(`\\b${s}\\b`).test(lower)) sizes.push(s.toUpperCase());
  });

  Object.entries(CATEGORY_ALIASES).forEach(([key, aliases]) => {
    if (aliases.some((a) => lower.includes(a))) categories.push(key);
  });

  Object.entries(FABRIC_ALIASES).forEach(([key, aliases]) => {
    if (aliases.some((a) => lower.includes(a))) fabrics.push(key);
  });

  // Strip detected terms from text for cleaner name search
  let text = raw;
  [...colors, ...sizes.map((s) => s.toLowerCase()), ...categories.flatMap((c) => CATEGORY_ALIASES[c]), ...fabrics.flatMap((f) => FABRIC_ALIASES[f])].forEach(
    (term) => { text = text.replace(new RegExp(term, "gi"), ""); }
  );
  text = text.trim().replace(/\s+/g, " ");

  return { text, colors, sizes, categories, fabrics };
}

// ── Static data ───────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "tops", name: "Tops" },
  { id: "leggings", name: "Leggings" },
  { id: "shorts", name: "Shorts" },
  { id: "conjuntos", name: "Conjuntos" },
];

const COLORS = [
  { id: "rose", name: "Rose", hex: "#D4A5A5" },
  { id: "mint", name: "Mint", hex: "#A8D5BA" },
  { id: "aloe", name: "Aloe", hex: "#C8E6C9" },
  { id: "hazel", name: "Hazel", hex: "#B8A68F" },
  { id: "preto", name: "Preto", hex: "#1A1A1A" },
  { id: "branco", name: "Branco", hex: "#F5F5F5" },
  { id: "mescla", name: "Mescla", hex: "#9E9E9E" },
];

const SIZES = ["PP", "P", "M", "G", "GG", "XG"];

const SUGGESTIONS = [
  "legging preta",
  "conjunto rosa",
  "top M",
  "short GG",
  "cropped mint",
];

const MAX_PRICE = 500;

function ProdutosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read state from URL
  const getParam = (key: string, fallback = "") => searchParams.get(key) || fallback;
  const getArray = (key: string) => {
    const v = searchParams.get(key);
    return v ? v.split(",").filter(Boolean) : [];
  };

  const [query, setQuery] = useState(getParam("q"));
  const [category, setCategory] = useState(getParam("cat", "all"));
  const [colors, setColors] = useState<string[]>(getArray("cores"));
  const [sizes, setSizes] = useState<string[]>(getArray("tamanhos"));
  const [maxPrice, setMaxPrice] = useState(Number(getParam("max", String(MAX_PRICE))));
  const [sort, setSort] = useState(getParam("ord", "relevance"));
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const [results, setResults] = useState<StoreProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega produtos do Supabase uma vez
  useEffect(() => {
    fetchProducts().then((data) => {
      setAllProducts(data);
    });
  }, []);

  // Sync URL on filter change
  const pushParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "relevance" && v !== String(MAX_PRICE)) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Apply all filters + NLP parsing
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const parsed = parseQuery(query);

      // Merge NLP-detected with explicit filters
      const effectiveColors = [...new Set([...colors, ...parsed.colors])];
      const effectiveSizes = [...new Set([...sizes, ...parsed.sizes])];
      const effectiveCategories = category !== "all" ? [category] : parsed.categories;

      let filtered = allProducts.filter((p: any) => {
        // Text search on name/code
        if (parsed.text && !p.name.toLowerCase().includes(parsed.text.toLowerCase()) &&
            !p.code?.toLowerCase().includes(parsed.text.toLowerCase())) return false;

        // Category
        if (effectiveCategories.length > 0 && !effectiveCategories.includes(p.category)) return false;

        // Colors
        if (effectiveColors.length > 0 && !effectiveColors.some((c) => p.colors?.map((x: string) => x.toLowerCase()).includes(c))) return false;

        // Sizes
        if (effectiveSizes.length > 0 && !effectiveSizes.some((s) => p.sizes?.includes(s))) return false;

        // Price
        if ((p.pixPrice ?? p.pix_price ?? p.price) > maxPrice) return false;

        return true;
      });

      switch (sort) {
        case "price-asc": filtered.sort((a: any, b: any) => (a.pixPrice ?? a.pix_price) - (b.pixPrice ?? b.pix_price)); break;
        case "price-desc": filtered.sort((a: any, b: any) => (b.pixPrice ?? b.pix_price) - (a.pixPrice ?? a.pix_price)); break;
        case "name": filtered.sort((a: any, b: any) => a.name.localeCompare(b.name)); break;
      }

      setResults(filtered);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, category, colors, sizes, maxPrice, sort, allProducts]);

  const toggleColor = (id: string) => setColors((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  const toggleSize = (s: string) => setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const clearAll = () => {
    setQuery(""); setCategory("all"); setColors([]); setSizes([]); setMaxPrice(MAX_PRICE); setSort("relevance");
    pushParams({ q: "", cat: "", cores: "", tamanhos: "", max: "", ord: "" });
  };

  const parsed = parseQuery(query);
  const nlpTags = [
    ...parsed.colors.map((c) => ({ label: COLORS.find((x) => x.id === c)?.name || c, type: "cor" })),
    ...parsed.sizes.map((s) => ({ label: s, type: "tam" })),
    ...parsed.categories.map((c) => ({ label: CATEGORIES.find((x) => x.id === c)?.name || c, type: "cat" })),
  ];

  const activeCount = (category !== "all" ? 1 : 0) + colors.length + sizes.length + (maxPrice < MAX_PRICE ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-[#8C2F39] hover:underline">Limpar tudo</button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoria</p>
        <div className="space-y-1">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                category === c.id ? "bg-[#8C2F39] text-white" : "hover:bg-gray-100"
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cor</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button key={c.id} onClick={() => toggleColor(c.id)} title={c.name}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                colors.includes(c.id) ? "border-[#8C2F39] scale-110 shadow" : "border-gray-300"
              }`}
              style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        {colors.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{colors.map((c) => COLORS.find((x) => x.id === c)?.name).join(", ")}</p>
        )}
      </div>

      {/* Sizes */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tamanho</p>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                sizes.includes(s) ? "bg-[#8C2F39] text-white border-[#8C2F39]" : "border-gray-300 hover:border-[#8C2F39]"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Preço máximo — R$ {maxPrice}
        </p>
        <input type="range" min={50} max={MAX_PRICE} step={10} value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#8C2F39]" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>R$ 50</span><span>R$ {MAX_PRICE}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-light mb-1">Produtos</h1>
          <p className="text-gray-500 text-sm">Moda fitness feminina de alta performance</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Busca inteligente — ex: "legging preta M" ou "conjunto rose"'
            className="w-full pl-11 pr-10 py-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-[#FAF6F2]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* NLP detected tags */}
        {nlpTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Detectado:</span>
            {nlpTags.map((tag, i) => (
              <span key={i} className="text-xs bg-[#8C2F39]/10 text-[#8C2F39] px-2 py-1 rounded-full">
                {tag.type}: {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Suggestion chips */}
        {!query && (
          <div className="flex flex-wrap gap-2 mb-5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setQuery(s)}
                className="text-xs bg-gray-100 hover:bg-[#FAF6F2] hover:text-[#8C2F39] px-3 py-1.5 rounded-full transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          {/* Mobile filters button */}
          <button onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm relative">
            <SlidersHorizontal size={16} />
            Filtros
            {activeCount > 0 && (
              <span className="w-5 h-5 bg-[#8C2F39] text-white text-[10px] rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          <div className="flex-1" />

          <p className="text-sm text-gray-500 hidden sm:block">
            {results.length} produto{results.length !== 1 ? "s" : ""}
          </p>

          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white">
            <option value="relevance">Relevância</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">A-Z</option>
          </select>
        </div>

        {/* Active filter tags */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {category !== "all" && (
              <span className="flex items-center gap-1 text-xs bg-[#8C2F39] text-white px-2.5 py-1.5 rounded-full">
                {CATEGORIES.find((c) => c.id === category)?.name}
                <button onClick={() => setCategory("all")}><X size={11} /></button>
              </span>
            )}
            {colors.map((c) => (
              <span key={c} className="flex items-center gap-1 text-xs bg-[#8C2F39] text-white px-2.5 py-1.5 rounded-full">
                {COLORS.find((x) => x.id === c)?.name}
                <button onClick={() => toggleColor(c)}><X size={11} /></button>
              </span>
            ))}
            {sizes.map((s) => (
              <span key={s} className="flex items-center gap-1 text-xs bg-[#8C2F39] text-white px-2.5 py-1.5 rounded-full">
                Tam. {s}
                <button onClick={() => toggleSize(s)}><X size={11} /></button>
              </span>
            ))}
            {maxPrice < MAX_PRICE && (
              <span className="flex items-center gap-1 text-xs bg-[#8C2F39] text-white px-2.5 py-1.5 rounded-full">
                até R$ {maxPrice}
                <button onClick={() => setMaxPrice(MAX_PRICE)}><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block col-span-1">
            <div className="bg-[#FAF6F2] rounded-2xl p-5 sticky top-4">
              <FilterPanel />
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-3">
            <p className="text-sm text-gray-500 mb-4 lg:hidden">
              {results.length} produto{results.length !== 1 ? "s" : ""}
            </p>

            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <Search size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-lg text-gray-400 mb-2">Nenhum resultado para "{query}"</p>
                <p className="text-sm text-gray-400 mb-6">Tente uma busca diferente ou remova alguns filtros</p>
                <button onClick={clearAll}
                  className="bg-[#8C2F39] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#7a2832] transition-colors">
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {showFilters && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowFilters(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 lg:hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold">Filtros</h3>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <FilterPanel />
            </div>
            <div className="px-5 pb-6 pt-3 border-t">
              <button onClick={() => setShowFilters(false)}
                className="w-full bg-[#8C2F39] text-white py-3 rounded-xl font-medium hover:bg-[#7a2832] transition-colors">
                Ver {results.length} produto{results.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"><Header /></div>}>
      <ProdutosContent />
    </Suspense>
  );
}
