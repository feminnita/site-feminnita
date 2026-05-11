"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Plus, Minus, Check } from "lucide-react";

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
    colors: string[];
    sizes: string[];
  };
}

const colorMap: { [key: string]: string } = {
  rose: "#D4A5A5",
  mint: "#A8D5BA",
  aloe: "#C8E6C9",
  hazel: "#B8A68F",
  cream: "#F5E6D3",
  mescla: "#9E9E9E",
  branco: "#FFFFFF",
  preto: "#000000",
  verde: "#4CAF50",
  azul: "#2196F3",
};

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    const cartItem = { ...product, selectedColor, quantity };
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItemIndex = existingCart.findIndex(
      (item: any) => item.id === product.id && item.selectedColor === selectedColor
    );
    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      existingCart.push(cartItem);
    }
    localStorage.setItem("cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cartUpdated"));
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
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 mb-3">
          <Image
            src={isHovered && product.images[1] ? product.images[1] : product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-opacity duration-300"
          />

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10"
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
        <p className="text-xs text-gray-500 uppercase">{product.code}</p>
        <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>

        {/* Price */}
        <div className="space-y-0.5">
          <p className="text-lg font-semibold">
            R$ {product.pixPrice.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-gray-600">via PIX ou Boleto</p>
          <p className="text-xs text-gray-500">
            (em até {product.installments}x de R${" "}
            {product.installmentPrice.toFixed(2).replace(".", ",")})
          </p>
        </div>

        {/* Color Selector */}
        {product.colors.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-600 mb-2">
              Cor: <span className="font-medium">{selectedColor}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-black scale-110"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{
                    backgroundColor: colorMap[color.toLowerCase()] || "#CCCCCC",
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="pt-2">
          <p className="text-xs text-gray-600 mb-2">Quantidade:</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center border rounded-md hover:bg-gray-100 transition-colors"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-16 h-8 text-center border rounded-md"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center border rounded-md hover:bg-gray-100 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={addToCart}
          className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-3 ${
            added
              ? "bg-green-600 text-white"
              : "bg-[#8C2F39] text-[#FAF6F2] hover:bg-[#7a2832]"
          }`}
        >
          {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {added ? "Adicionado!" : "Adicionar ao Carrinho"}
        </button>

        {/* Virtual Fitting Room Button */}
        <Link href={`/provador?produto=${product.id}`}>
          <button className="w-full mt-2 border-2 border-[#8C2F39] text-[#8C2F39] py-3 rounded-lg font-medium hover:bg-[#8C2F39] hover:text-[#FAF6F2] transition-all flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Provador Virtual
          </button>
        </Link>
      </div>
    </div>
  );
}
