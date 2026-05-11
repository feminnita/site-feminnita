"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";

type HotspotProduct = {
  id: string;
  name: string;
  pix_price: number;
  images: string[];
  hotspot_x: number; // 0-100 percentage from left
  hotspot_y: number; // 0-100 percentage from top
};

type Props = {
  image: string;
  alt: string;
  products: HotspotProduct[];
};

function addToCart(product: HotspotProduct) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((i: any) => i.id === product.id);
  if (idx > -1) cart[idx].quantity += 1;
  else cart.push({ ...product, pixPrice: product.pix_price, selectedSize: "", selectedColor: "", quantity: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export function ShopTheLook({ image, alt, products }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const hotspots = products.filter((p) => p.hotspot_x != null && p.hotspot_y != null);

  const handleAdd = (e: React.MouseEvent, product: HotspotProduct) => {
    e.preventDefault();
    addToCart(product);
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1800);
  };

  return (
    <div className="relative w-full" onClick={() => setActive(null)}>
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden">
        <Image src={image} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />

        {hotspots.map((product) => (
          <div
            key={product.id}
            className="absolute"
            style={{ left: `${product.hotspot_x}%`, top: `${product.hotspot_y}%`, transform: "translate(-50%, -50%)" }}
          >
            {/* Pulse ring + pin button */}
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-white/60 animate-ping scale-150" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(active === product.id ? null : product.id);
                }}
                className="relative w-8 h-8 rounded-full bg-white shadow-lg border-2 border-[#8C2F39] flex items-center justify-center hover:scale-110 transition-transform z-10"
                aria-label={`Ver ${product.name}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C2F39]" />
              </button>

              {/* Popover card */}
              {active === product.id && (
                <div
                  className={`absolute z-20 bg-white rounded-2xl shadow-2xl border w-56 overflow-hidden
                    ${product.hotspot_x > 60 ? "right-0" : "left-0"}
                    ${product.hotspot_y > 65 ? "bottom-full mb-2" : "top-full mt-2"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setActive(null)}
                    className="absolute top-2 right-2 z-10 bg-black/30 rounded-full p-0.5 text-white hover:bg-black/50"
                  >
                    <X size={12} />
                  </button>

                  <Link href={`/produto/${product.id}`}>
                    <div className="relative aspect-square bg-gray-100">
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="224px"
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                  </Link>

                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-[#8C2F39] font-bold text-sm mb-2">
                      R$ {product.pix_price.toFixed(2).replace(".", ",")}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/produto/${product.id}`}
                        className="flex-1 text-center text-xs border border-[#8C2F39] text-[#8C2F39] py-1.5 rounded-lg hover:bg-[#8C2F39] hover:text-white transition-colors"
                      >
                        Ver produto
                      </Link>
                      <button
                        onClick={(e) => handleAdd(e, product)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          added === product.id
                            ? "bg-green-500 text-white"
                            : "bg-[#8C2F39] text-white hover:bg-[#7a2832]"
                        }`}
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hotspots.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#8C2F39]" />
          Toque nos pontos para ver as peças
        </p>
      )}
    </div>
  );
}
