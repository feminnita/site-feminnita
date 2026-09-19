"use client";

import { Header } from "../../../components/layout/Header";
import { ProductCard } from "../../../components/product/ProductCard";
import { PRODUCT_GRID } from "../../../components/product/productGrid";
import { CategoryBanner } from "../../../components/category/CategoryBanner";
import { fetchProducts } from "../../../services/productsService";
import { fetchCategories } from "../../../services/categoriesService";
import { getCategoryBanner } from "../../../services/bannersService";
import { collectDescendantGrandchildrenIds } from "../../../utils/categories";
import { abrePorCor, abrirCoresEmCards } from "../../../utils/vitrine";
import type { CardDeVitrine } from "../../../utils/vitrine";
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
    // Guardadas para agrupar a pagina por SETOR (as filhas da categoria aberta).
    const [todasCategorias, setTodasCategorias] = useState<CategoryRow[]>([]);
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
            setTodasCategorias(allCats);
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

    // Agrupa os produtos pelo SETOR a que pertencem — a filha da categoria
    // aberta que contem o produto (direto ou mais abaixo). Produto ligado na
    // propria categoria cai em "Outros", no fim: e melhor aparecer numa secao
    // generica do que sumir da pagina.
    const setores = (() => {
        if (!category) return [];
        const filhas = todasCategorias.filter((c) => c.parentId === category.id);
        if (!filhas.length) return [];

        const usados = new Set<string>();
        const lista = filhas
            .map((filha) => {
                const dentro = new Set(
                    collectDescendantGrandchildrenIds(todasCategorias, filha.id),
                );
                const itens = products.filter(
                    (p) => p.category_id && dentro.has(p.category_id),
                );
                itens.forEach((p) => usados.add(p.id));
                return { id: filha.id, nome: filha.name, itens };
            })
            .filter((s) => s.itens.length > 0);

        const sobraram = products.filter((p) => !usados.has(p.id));
        if (sobraram.length) {
            lista.push({ id: "__outros", nome: "Outros", itens: sobraram });
        }
        return lista;
    })();

    // No masculino cada cor fotografada vira um card proprio: sao 6 produtos em
    // tres setores, entao a grade mostrava 2 cards por linha e metade da tela
    // vazia — escondendo as 44 estampas que existem de verdade.
    const porCor = abrePorCor(category, todasCategorias);

    const montarCards = (lista: StoreProduct[]): CardDeVitrine[] =>
        porCor
            ? abrirCoresEmCards(lista)
            : lista.map((p) => ({ chave: p.id, produto: p }));

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
                    setores.length > 1 ? (
                        // Uma secao por SETOR (as filhas da categoria aberta).
                        // Em Feminino sao 40+ produtos misturados: pijama curto,
                        // longo, plus size, blusa. Numa grade so, a cliente rola
                        // sem achar o que quer — separado, ela vai direto.
                        setores.map((setor) => (
                            <section key={setor.id} className="mb-14">
                                <div className="mb-6 flex items-baseline justify-between gap-4 border-b pb-2">
                                    <h2 className="text-2xl font-light">{setor.nome}</h2>
                                    <span className="shrink-0 text-sm text-gray-400">
                                        {setor.itens.length}{" "}
                                        {setor.itens.length === 1 ? "produto" : "produtos"}
                                    </span>
                                </div>
                                <div className={PRODUCT_GRID}>
                                    {montarCards(setor.itens).map((card) => (
                                        <ProductCard
                                            key={card.chave}
                                            product={card.produto}
                                            overrideImage={card.foto}
                                            colorLabel={card.cor}
                                            corDoLink={card.cor}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className={PRODUCT_GRID}>
                            {montarCards(products).map((card) => (
                                <ProductCard
                                    key={card.chave}
                                    product={card.produto}
                                    overrideImage={card.foto}
                                    colorLabel={card.cor}
                                    corDoLink={card.cor}
                                />
                            ))}
                        </div>
                    )
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
