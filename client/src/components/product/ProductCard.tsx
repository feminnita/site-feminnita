"use client";

import {
    Check,
    ChevronLeft,
    ChevronRight,
    Heart,
    ImageOff,
    Minus,
    Plus,
    ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useCart } from "../../hooks/cart/useCart";
import { PIX_DISCOUNT_RATE } from "@/src/utils/pricing";
import { useColorSwatches } from "../../hooks/color/useColorSwatches";
import { ColorCarousel } from "./ColorCarousel";

interface ProductCardProps {
    product: {
        id: string;
        code: string;
        name: string;
        price: number;
        pixPrice: number;
        installments: number;
        installmentPrice: number;
        images: string[];
        colorImages?: Record<string, string[]>;
        colors: string[];
        sizes: string[];
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
    const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const colorScrollRef = useRef<HTMLDivElement>(null);
    const swatches = useColorSwatches();

    const displayImages = product.colorImages?.[selectedColor]?.length
        ? product.colorImages[selectedColor]
        : product.images;

    const cover =
        isHovered && displayImages[1] ? displayImages[1] : displayImages[0];

    const scrollColors = (dir: number) => {
        colorScrollRef.current?.scrollBy({ left: dir * 60, behavior: "smooth" });
    };

    const { add } = useCart();

    const addToCart = () => {
        add({ ...product, selectedColor, selectedSize, quantity });

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div
            className="product-card group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Product Image */}
            <Link href={`/produto/${product.id}`}>
                <div className="relative mb-3 aspect-[2/3] overflow-hidden bg-gray-100">
                    {cover ? (
                        <Image
                            src={cover}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-opacity duration-300"
                            quality={90}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
                            <ImageOff size={32} />
                            <span className="text-xs">Sem foto</span>
                        </div>
                    )}

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsFavorite(!isFavorite);
                        }}
                        className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-100"
                    >
                        <Heart
                            size={18}
                            className={isFavorite ? "fill-red-500 text-red-500" : ""}
                        />
                    </button>
                </div>
            </Link>

            {/* Product Info */}
            <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500">{product.code}</p>
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">
                    {product.name}
                </h3>
                {/* Price */}
                <div className="space-y-0.5">
                    <p className="text-lg font-semibold">
                        R$ {product.price.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-xs text-gray-600">
                        R${" "}
                        {(product.price * (1 - PIX_DISCOUNT_RATE))
                            .toFixed(2)
                            .replace(".", ",")}{" "}
                        no PIX
                    </p>
                    <p className="text-xs text-gray-500">
                        (em até {product.installments}x de R${" "}
                        {product.installmentPrice.toFixed(2).replace(".", ",")})
                    </p>
                </div>

                {/* Color Selector */}
                {product.colors.length > 0 && (
                    <div className="pt-2">
                        <p className="mb-2 text-center text-xs text-gray-600">
                            Cor: <span className="font-medium">{selectedColor}</span>
                        </p>
                        <ColorCarousel
                            colors={product.colors}
                            selectedColor={selectedColor}
                            onSelect={setSelectedColor}
                            swatches={swatches}
                        />
                    </div>
                )}


                {/* Size Selector */}
                {product.sizes.length > 0 && (
                    <div className="pt-2">
                        <p className="mb-2 text-xs text-gray-600">
                            Tamanho: <span className="font-medium">{selectedSize}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`h-9 min-w-[2.25rem] rounded-md border px-2 text-sm font-medium transition-all ${selectedSize === size
                                        ? "border-black bg-black text-white"
                                        : "border-gray-300 hover:border-gray-500"
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quantity Selector */}
                <div className="pt-2">
                    <p className="mb-2 text-xs text-gray-600">Quantidade:</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-gray-100"
                        >
                            <Minus size={16} />
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))
                            }
                            className="h-8 w-12 min-w-0 rounded-md border text-center"
                        />
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-gray-100"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <button
                    onClick={addToCart}
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-colors md:text-base ${added
                        ? "bg-green-600 text-white"
                        : "bg-[#8C2F39] text-[#FAF6F2] hover:bg-[#7a2832]"
                        }`}
                >
                    {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                    <span className="sm:hidden">{added ? "Feito!" : "Adicionar"}</span>
                    <span className="hidden sm:inline">
                        {added ? "Adicionado!" : "Adicionar ao Carrinho"}
                    </span>
                </button>

                {/* <Link href={`/provador?produto=${product.id}`}>
                    <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#8C2F39] py-3 text-sm font-medium text-[#8C2F39] transition-all hover:bg-[#8C2F39] hover:text-[#FAF6F2] md:text-base">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span className="sm:hidden">Provador</span>
                        <span className="hidden sm:inline">Provador Virtual</span>
                    </button>
                </Link> */}
            </div>
        </div>
    );
}
