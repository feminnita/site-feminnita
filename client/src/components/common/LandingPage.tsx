"use client";

import { Header } from "../layout/Header";
import { PRODUCT_GRID } from "../product/productGrid";
import { useCart } from "../../hooks/cart/useCart";
import type { StoreProduct } from "../../types/product/products";
import { ImageOff, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Theme = "promo" | "launch" | "black-friday";

type Props = {
    theme: Theme;
    title: string;
    subtitle: string;
    badge: string;
    accentColor: string;
    products: StoreProduct[];
    countdown?: Date;
};

function Countdown({ target }: { target: Date }) {
    const calc = () => {
        const diff = Math.max(0, target.getTime() - Date.now());
        return {
            d: Math.floor(diff / 86400000),
            h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
        };
    };
    const [t, setT] = useState(calc);
    useEffect(() => {
        const i = setInterval(() => setT(calc()), 1000);
        return () => clearInterval(i);
    }, []);

    const pad = (n: number) => String(n).padStart(2, "0");

    return (
        <div className="mt-4 flex justify-center gap-3">
            {[
                ["d", "dias"],
                ["h", "horas"],
                ["m", "min"],
                ["s", "seg"],
            ].map(([k, label]) => (
                <div key={k} className="text-center">
                    <div className="min-w-[64px] rounded-xl bg-white/20 px-4 py-3 backdrop-blur">
                        <p className="text-3xl font-bold tabular-nums">
                            {pad((t as any)[k])}
                        </p>
                    </div>
                    <p className="mt-1 text-xs opacity-70">{label}</p>
                </div>
            ))}
        </div>
    );
}

const themeHero: Record<Theme, string> = {
    promo: "bg-gradient-to-br from-red-700 to-red-900",
    launch: "bg-gradient-to-br from-[#8C2F39] to-[#3d1218]",
    "black-friday": "bg-black",
};

export function LandingPage({
    theme,
    title,
    subtitle,
    badge,
    accentColor,
    products,
    countdown,
}: Props) {
    const { add } = useCart();

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

            {/* Hero */}
            <div className={`${themeHero[theme]} px-4 py-16 text-center text-white`}>
                <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
                    {badge}
                </span>
                <h1 className="mb-3 text-5xl font-black tracking-tight md:text-7xl">
                    {title}
                </h1>
                <p className="text-lg opacity-80">{subtitle}</p>
                {countdown && <Countdown target={countdown} />}
            </div>

            {/* Products */}
            <div className="container mx-auto px-4 py-12">
                {products.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <p className="text-xl">Em breve!</p>
                    </div>
                ) : (
                    <>
                        <p className="mb-6 text-sm text-gray-500">
                            {products.length} produtos encontrados
                        </p>
                        <div className={PRODUCT_GRID}>
                            {products.map((product) => (
                                <div key={product.id} className="group">
                                    <Link href={`/produto/${product.id}`}>
                                        <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                                            {product.images?.[0] ? (
                                                <Image
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    className="object-cover object-top transition-opacity duration-300"
                                                    quality={90}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                    <ImageOff size={32} />
                                                </div>
                                            )}
                                            {product.price > product.pixPrice && (
                                                <span
                                                    className="absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-bold text-white"
                                                    style={{ backgroundColor: accentColor }}
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
                                            <p className="font-bold" style={{ color: accentColor }}>
                                                R$ {product.pixPrice.toFixed(2).replace(".", ",")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="rounded-lg p-2 text-white transition-all active:scale-95"
                                            style={{ backgroundColor: accentColor }}
                                        >
                                            <ShoppingCart size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
