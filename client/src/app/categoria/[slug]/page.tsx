"use client";

import { Header } from "../../../components/layout/Header";
import { ProductCard } from "../../../components/product/ProductCard";
import { PRODUCT_GRID } from "../../../components/product/productGrid";
import { CategoryBanner } from "../../../components/category/CategoryBanner";
import { fetchProducts } from "../../../services/productsService";
import { fetchCategories } from "../../../services/categoriesService";
import { getCategoryBanner } from "../../../services/bannersService";
import { collectDescendantGrandchildrenIds } from "../../../utils/categories";
import type { CategoryRow } from "../../../types/categories/categories";
import type { CategoryBanner as CategoryBannerType } from "../../../types/banners/banners";
import type { StoreProduct } from "../../../types/product/products";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CategoryPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [category, setCategory] = useState<CategoryRow | null>(null);
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [banner, setBanner] = useState<CategoryBannerType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        async function load() {
            setLoading(true);

            const [allCats, catBanner] = await Promise.all([
                fetchCategories(),
                getCategoryBanner(slug),
            ]);
            setBanner(catBanner);
            const cat = allCats.find((c) => c.slug === slug) ?? null;
            setCategory(cat);

            if (cat) {
                const netoIds = new Set(
                    collectDescendantGrandchildrenIds(allCats, cat.id),
                );

                const all = await fetchProducts();
                setProducts(
                    all.filter((p) => p.category_id && netoIds.has(p.category_id)),
                );
            }

            setLoading(false);
        }

        load();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="flex items-center justify-center py-32">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="mb-4 text-2xl">Categoria não encontrada</h1>
                    <a href="/" className="text-blue-600 underline">
                        Voltar para home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {banner && <CategoryBanner banner={banner} />}

            <div className="container mx-auto px-4 py-8">
                <h1 className="mb-2 text-4xl font-light">{category.name}</h1>
                {category.description && (
                    <p className="mb-2 text-sm text-gray-500">{category.description}</p>
                )}
                <p className="mb-8 text-gray-600">
                    {products.length} {products.length === 1 ? "produto" : "produtos"}
                </p>

                {products.length > 0 ? (
                    <div className={PRODUCT_GRID}>
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center text-gray-400">
                        <p className="text-xl">Nenhum produto disponível no momento</p>
                        <p className="mt-2 text-sm">Volte em breve.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
