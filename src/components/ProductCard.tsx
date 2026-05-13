"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  pixPrice: number;
  installments: number;
  installmentPrice: number;
  images: string[];
  colors: string[];
  sizes: string[];
}

export function ProductCard({ product }: { product: Product }) {
  const [hovered, setIsHovered] = useState(false);
  const [fav, setFav] = useState(false);

  const fmt = (v: number) => v.toFixed(2).replace(".", ",");

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((i: any) => i.id === product.id);
    if (idx > -1) cart[idx].quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Image container */}
      <Link href={`/produto/${product.id}`} className="block relative overflow-hidden bg-[#f9f7f5]" style={{ aspectRatio: "2/3" }}>
        {/* Image 1 */}
        <Image
          src={product.images[0] || "/placeholder.jpg"}
          alt={product.name}
          fill
          className={`object-cover transition-opacity duration-500 ${hovered && product.images[1] ? "opacity-0" : "opacity-100"}`}
        />
        {/* Image 2 (hover) */}
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {/* Favoritar (top right) */}
        <button
          onClick={(e) => { e.preventDefault(); setFav(!fav); }}
          className={`absolute top-3 right-3 z-10 transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
          aria-label="Favoritar"
        >
          <Heart
            size={20}
            strokeWidth={1.5}
            className={fav ? "fill-[#8C2F39] text-[#8C2F39]" : "text-gray-800"}
          />
        </button>

        {/* Comprar (bottom overlay) */}
        <div
          className={`absolute bottom-0 inset-x-0 flex transition-all duration-300 ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <button
            onClick={addToCart}
            className="flex-1 bg-white text-gray-900 text-[11px] font-semibold tracking-widest uppercase py-3 hover:bg-[#8C2F39] hover:text-white transition-colors duration-200"
          >
            Comprar
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{product.code}</p>
        <h3 className="text-[13px] text-gray-800 font-light leading-snug">{product.name}</h3>
        <div className="pt-1">
          <p className="text-[13px] font-medium text-gray-900">R$ {fmt(product.pixPrice)}</p>
          <p className="text-[11px] text-gray-500">via PIX ou Boleto</p>
          <p className="text-[11px] text-gray-400">(em até {product.installments}x de R$ {fmt(product.installmentPrice)})</p>
        </div>

        {/* Cores */}
        {product.colors.length > 0 && (
          <div className="flex gap-1.5 pt-1 flex-wrap">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c}
                title={c}
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: colorHex(c) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function colorHex(name: string) {
  const map: Record<string, string> = {
    rose: "#D4A5A5", mint: "#A8D5BA", aloe: "#C8E6C9", hazel: "#B8A68F",
    cream: "#F5E6D3", mescla: "#9E9E9E", branco: "#FFFFFF", preto: "#1a1a1a",
    verde: "#4CAF50", azul: "#2196F3", rosa: "#F48FB1", lilás: "#CE93D8",
    nude: "#E8C8B0", cinza: "#BDBDBD",
  };
  return map[name.toLowerCase()] || "#CCCCCC";
}
