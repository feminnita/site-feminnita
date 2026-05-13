import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import productsData from "@/data/products.json";

interface Props {
  searchParams: { q?: string; tamanho?: string; categoria?: string };
}

export default function BuscaPage({ searchParams }: Props) {
  const query = searchParams.q?.toLowerCase() || "";
  const categorias = ["pijamas", "camisolas", "shorts-doll", "conjuntos", "outlet"];
  const sizes = ["PP", "P", "M", "G", "GG"];

  let results = productsData;

  if (query) {
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  if (searchParams.categoria) {
    results = results.filter((p) => p.category === searchParams.categoria);
  }

  if (searchParams.tamanho) {
    results = results.filter((p) => p.sizes.includes(searchParams.tamanho!));
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <h1 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-600 mb-6">
          {query ? `Resultados para "${searchParams.q}"` : "Todos os Produtos"}
          <span className="ml-3 text-gray-400 normal-case tracking-normal text-sm">
            ({results.length} produto{results.length !== 1 ? "s" : ""})
          </span>
        </h1>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-3">Categoria</p>
              <div className="space-y-1.5">
                <a
                  href={`/busca?${query ? `q=${encodeURIComponent(query)}&` : ""}${searchParams.tamanho ? `tamanho=${searchParams.tamanho}` : ""}`}
                  className="block text-[13px] transition-colors"
                  style={{ color: !searchParams.categoria ? "#8C2F39" : "#555", fontWeight: !searchParams.categoria ? 600 : 400 }}
                >
                  Todos
                </a>
                {categorias.map((cat) => (
                  <a
                    key={cat}
                    href={`/busca?${query ? `q=${encodeURIComponent(query)}&` : ""}categoria=${cat}${searchParams.tamanho ? `&tamanho=${searchParams.tamanho}` : ""}`}
                    className="block text-[13px] capitalize transition-colors"
                    style={{
                      color: searchParams.categoria === cat ? "#8C2F39" : "#555",
                      fontWeight: searchParams.categoria === cat ? 600 : 400,
                    }}
                  >
                    {cat.replace("-", " ")}
                  </a>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-3">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <a
                    key={s}
                    href={`/busca?${query ? `q=${encodeURIComponent(query)}&` : ""}${searchParams.categoria ? `categoria=${searchParams.categoria}&` : ""}tamanho=${s}`}
                    className="w-9 h-9 flex items-center justify-center border text-[12px] transition-colors"
                    style={{
                      borderColor: searchParams.tamanho === s ? "#8C2F39" : "#e0e0e0",
                      color: searchParams.tamanho === s ? "#8C2F39" : "#555",
                      fontWeight: searchParams.tamanho === s ? 700 : 400,
                    }}
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {results.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-2">Nenhum produto encontrado</p>
                {query && (
                  <p className="text-sm">Tente buscar por outro termo</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
