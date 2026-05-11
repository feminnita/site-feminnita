"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

type Product = {
  id: string;
  name: string;
  pixPrice: number;
  images: string[];
  category: string;
};

type Props = {
  currentProductId: string;
  category: string;
  allProducts: Product[];
};

export function CompleteOLook({ currentProductId, category, allProducts }: Props) {
  const suggestions = allProducts
    .filter((p) => p.id !== currentProductId && p.category !== category)
    .slice(0, 4);

  if (suggestions.length === 0) return null;

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((i: any) => i.id === product.id);
    if (idx > -1) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ ...product, selectedColor: "", selectedSize: "", quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <section className="mt-16 border-t pt-12">
      <h2 className="text-2xl font-light mb-2">Complete o Look</h2>
      <p className="text-gray-500 text-sm mb-8">Peças que combinam com este produto</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {suggestions.map((product) => (
          <div key={product.id} className="group">
            <Link href={`/produto/${product.id}`}>
              <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden mb-3">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
            <p className="text-sm font-medium truncate mb-1">{product.name}</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#8C2F39]">
                R$ {product.pixPrice.toFixed(2).replace(".", ",")}
              </p>
              <button
                onClick={() => addToCart(product)}
                className="p-2 bg-[#8C2F39] text-white rounded-lg hover:bg-[#7a2832] active:scale-95 transition-all"
                aria-label={`Adicionar ${product.name} ao carrinho`}
              >
                <ShoppingCart size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
