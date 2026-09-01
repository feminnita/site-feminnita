"use client";

import { Header } from "../layout/Header";
import { useCart } from "../../hooks/cart/useCart";
import type { StoreProduct } from "../../types/product/products";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
    title: string;
    products: StoreProduct[];
};

const ACCENT = "#8C2F39";

// Mesmo cover da home: primeira imagem da primeira cor (colorImages) OU images[0].
function getCover(product: StoreProduct): string | null {
    const colorImages = product.colorImages ?? {};
    for (const imgs of Object.values(colorImages)) {
        if (Array.isArray(imgs) && imgs[0]) return imgs[0];
    }
    return product.images?.[0] ?? null;
}

export function LandingPage({ title, products }: Props) {
    const { add } = useCart();

    // Filtra fora produtos sem foto antes de renderizar — nenhum card sem imagem.
    const visible = products.filter((p) => getCover(p) !== null);

    const addToCart = (product: StoreProduct) => {
        add({
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.price,
            pixPrice: product.pixPrice,
            quantity: 1,
            selectedColor: "",
            selectedSize: "",
            category: product.category,
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Products */}
            <div className="container mx-auto px-4 py-12">
                <h1 className="mb-8 text-center text-3xl font-light">{title}</h1>

                {visible.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <p className="text-xl">Em breve!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                        {visible.map((product) => {
                            const cover = getCover(product) as string;
                            return (
                                <div key={product.id} className="group">
                                    <Link href={`/produto/${product.id}`}>
                                        <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                                            <Image
                                                src={cover}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="object-cover object-top transition-opacity duration-300"
                                                quality={90}
                                            />
                                            {product.price > product.pixPrice && (
                                                <span
                                                    className="absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-bold text-white"
                                                    style={{ backgroundColor: ACCENT }}
                                                >
                                                    -
                                                    {Math.round(
                                                        (1 - product.pixPrice / product.price) * 100,
                                                    )}
                                                    %
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                    <p className="mb-1 truncate text-sm font-medium">
                                        {product.name}
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            {product.price > product.pixPrice && (
                                                <p className="text-xs text-gray-400 line-through">
                                                    R$ {product.price.toFixed(2).replace(".", ",")}
                                                </p>
                                            )}
                                            <p className="font-bold" style={{ color: ACCENT }}>
                                                R$ {product.pixPrice.toFixed(2).replace(".", ",")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="rounded-lg p-2 text-white transition-all active:scale-95"
                                            style={{ backgroundColor: ACCENT }}
                                        >
                                            <ShoppingCart size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
