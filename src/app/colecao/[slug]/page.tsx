import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getProductsByCategoryServer, getProductsServer, adaptProduct } from "@/lib/supabase/products";
import productsJson from "@/data/products.json";
import { notFound } from "next/navigation";

const categoryMap: Record<string, { title: string; description: string }> = {
  pijamas:       { title: "Pijamas",      description: "Conforto e elegância para suas noites" },
  camisolas:     { title: "Camisolas",    description: "Sofisticação em cada detalhe" },
  "shorts-doll": { title: "Shorts Doll",  description: "Leveza e feminilidade para o seu descanso" },
  conjuntos:     { title: "Conjuntos",    description: "Estilo coordenado para toda a família" },
  outlet:        { title: "Outlet",       description: "Qualidade Feminnita com preço especial" },
  lancamentos:   { title: "Lançamentos",  description: "Novidades fresquinhas para você" },
};

interface Props {
  params: { slug: string };
  searchParams: { tamanho?: string; ordenar?: string };
}

async function getProducts(slug: string) {
  try {
    let raw;
    if (slug === "lancamentos") {
      raw = await getProductsServer({ is_new: true });
      if (!raw.length) raw = await getProductsServer({ limit: 20 });
    } else if (slug === "outlet") {
      raw = await getProductsServer();
      raw = raw.filter((p) => p.sale_price && p.sale_price < p.base_price);
    } else {
      raw = await getProductsByCategoryServer(slug);
    }
    if (raw.length > 0) return raw.map(adaptProduct);
  } catch {}
  // fallback JSON
  const all = productsJson as ReturnType<typeof adaptProduct>[];
  if (slug === "lancamentos") return all.filter((p) => p.category !== "outlet");
  return all.filter((p) => p.category === slug);
}

export default async function ColecaoPage({ params, searchParams }: Props) {
  const { slug } = params;
  const info = categoryMap[slug];
  if (!info) notFound();

  let products = await getProducts(slug);

  if (searchParams.tamanho) {
    products = products.filter((p) => (p.sizes as string[]).includes(searchParams.tamanho!));
  }
  if (searchParams.ordenar === "menor-preco") products = [...products].sort((a, b) => a.price - b.price);
  if (searchParams.ordenar === "maior-preco") products = [...products].sort((a, b) => b.price - a.price);

  const sizes = ["PP", "P", "M", "G", "GG"];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Banner */}
      <section className="flex flex-col items-center justify-center text-center px-6" style={{
        minHeight: 200,
        background: slug === "outlet" ? "linear-gradient(135deg,#2e1a20,#8C2F39)" : "linear-gradient(160deg,#f5ece6,#e0cfc6)",
      }}>
        <h1 className="text-3xl md:text-4xl font-extralight tracking-wider mb-2"
          style={{ fontFamily: "serif", color: slug === "outlet" ? "#fff" : "#2e1a20" }}>
          {info.title}
        </h1>
        <p className="text-sm font-light" style={{ color: slug === "outlet" ? "rgba(255,255,255,0.8)" : "#666" }}>
          {info.description}
        </p>
        {slug === "outlet" && (
          <span className="mt-3 text-[11px] uppercase tracking-[0.3em] border border-white/50 text-white px-6 py-2">
            até 50% OFF
          </span>
        )}
      </section>

      {/* Filter bar */}
      <div className="border-b border-gray-100 bg-white sticky top-[68px] z-20">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Tamanho:</span>
            {sizes.map((s) => (
              <a key={s}
                href={`?tamanho=${s}${searchParams.ordenar ? `&ordenar=${searchParams.ordenar}` : ""}`}
                className="w-8 h-8 flex items-center justify-center border text-[11px] transition-colors"
                style={{ borderColor: searchParams.tamanho === s ? "#8C2F39" : "#e0e0e0", color: searchParams.tamanho === s ? "#8C2F39" : "#555", fontWeight: searchParams.tamanho === s ? 700 : 400 }}>
                {s}
              </a>
            ))}
            {searchParams.tamanho && <a href="?" className="text-[11px] text-gray-400 hover:text-gray-700 ml-1">Limpar</a>}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Ordenar:</span>
            {[
              { value: "", label: "Relevância" },
              { value: "menor-preco", label: "Menor Preço" },
              { value: "maior-preco", label: "Maior Preço" },
            ].map((opt) => (
              <a key={opt.value}
                href={`?${searchParams.tamanho ? `tamanho=${searchParams.tamanho}&` : ""}${opt.value ? `ordenar=${opt.value}` : ""}`}
                className="text-[12px] transition-colors"
                style={{ color: (searchParams.ordenar || "") === opt.value ? "#8C2F39" : "#666", fontWeight: (searchParams.ordenar || "") === opt.value ? 700 : 400 }}>
                {opt.label}
              </a>
            ))}
          </div>
          <span className="text-[11px] text-gray-400">{products.length} produto{products.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-[1200px] mx-auto px-4 py-10">
        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">Nenhum produto encontrado</p>
            <a href={`/colecao/${slug}`} className="text-[#8C2F39] text-sm underline">Limpar filtros</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(categoryMap).map((slug) => ({ slug }));
}
