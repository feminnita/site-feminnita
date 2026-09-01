"use client";

import { Suspense } from "react";
import { Search } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { ProductCard } from "../../components/product/ProductCard";
import { ProductGridSelecton } from "@/src/components/product/ProductCardSelecton";
import { FilterPanel } from "@/src/components/catalog/FilterPanel";
import { MobileFilterSheet } from "@/src/components/catalog/MobileFilterSheet";
import { SearchBar } from "@/src/components/catalog/SearchBar";
import { SuggestionChips } from "@/src/components/catalog/SuggestionChips";
import { Toolbar } from "@/src/components/catalog/Toolbar";
import { useProductsPage } from "@/src/hooks/product/useProductsPage";

function ProdutosContent() {
    const vm = useProductsPage();

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="mb-1 text-3xl font-light">Produtos</h1>
                    <p className="text-sm text-gray-500">
                        Moda fitness feminina de alta performance
                    </p>
                </div>

                <SearchBar query={vm.query} onChange={vm.setQuery} />
                <SuggestionChips visible={!vm.query} onSelect={vm.setQuery} />

                <Toolbar
                    resultCount={vm.results.length}
                    activeCount={vm.activeCount}
                    sort={vm.sort}
                    onSortChange={vm.setSort}
                    onOpenFilters={() => vm.setShowFilters(true)}
                />

                <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                    <aside className="col-span-1 hidden lg:block">
                        <div className="sticky top-4 rounded-2xl bg-[#FAF6F2] p-5">
                            <FilterPanel
                                categoryTree={vm.categoryTree}
                                category={vm.category}
                                onCategoryChange={vm.setCategory}
                                sizes={vm.sizes}
                                onToggleSize={vm.toggleSize}
                                maxPrice={vm.maxPrice}
                                maxPriceLimit={vm.maxPriceLimit}
                                onMaxPriceChange={vm.setMaxPrice}
                                activeCount={vm.activeCount}
                                onClearAll={vm.clearAll}
                                availableSizes={vm.availableSizes}
                            />
                        </div>
                    </aside>

                    <div className="lg:col-span-3">
                        <p className="mb-4 text-sm text-gray-500 lg:hidden">
                            {vm.results.length} produto{vm.results.length !== 1 ? "s" : ""}
                        </p>

                        {vm.loading ? (
                            <ProductGridSelecton count={6} />
                        ) : vm.results.length === 0 ? (
                            <div className="py-16 text-center">
                                <Search size={48} className="mx-auto mb-4 text-gray-200" />
                                <p className="mb-2 text-lg text-gray-400">
                                    Nenhum resultado para "{vm.query}"
                                </p>
                                <p className="mb-6 text-sm text-gray-400">
                                    Tente uma busca diferente ou remova alguns filtros
                                </p>
                                <button
                                    onClick={vm.clearAll}
                                    className="rounded-xl bg-[#8C2F39] px-6 py-2.5 text-sm text-white transition-colors hover:bg-[#7a2832]"
                                >
                                    Ver todos os produtos
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                                {vm.results.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MobileFilterSheet
                open={vm.showFilters}
                onClose={() => vm.setShowFilters(false)}
                resultCount={vm.results.length}
            >
                <FilterPanel
                    categoryTree={vm.categoryTree}
                    category={vm.category}
                    onCategoryChange={vm.setCategory}
                    availableSizes={vm.availableSizes}
                    sizes={vm.sizes}
                    onToggleSize={vm.toggleSize}
                    maxPrice={vm.maxPrice}
                    maxPriceLimit={vm.maxPriceLimit}
                    onMaxPriceChange={vm.setMaxPrice}
                    activeCount={vm.activeCount}
                    onClearAll={vm.clearAll}
                />
            </MobileFilterSheet>
        </div>
    );
}

export default function ProdutosPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white">
                    <Header />
                </div>
            }
        >
            <ProdutosContent />
        </Suspense>
    );
}
