"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ShoppingCart } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  pix_price: number;
  images: string[];
  category: string;
  slug?: string;
};

type Theme = "promo" | "launch" | "black-friday";

type Props = {
  theme: Theme;
  title: string;
  subtitle: string;
  badge: string;
  accentColor: string;
  products: Product[];
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
    <div className="flex gap-3 justify-center mt-4">
      {[["d", "dias"], ["h", "horas"], ["m", "min"], ["s", "seg"]].map(([k, label]) => (
        <div key={k} className="text-center">
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 min-w-[64px]">
            <p className="text-3xl font-bold tabular-nums">{pad((t as any)[k])}</p>
          </div>
          <p className="text-xs mt-1 opacity-70">{label}</p>
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

export function LandingPage({ theme, title, subtitle, badge, accentColor, products, countdown }: Props) {
  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((i: any) => i.id === product.id);
    if (idx > -1) cart[idx].quantity += 1;
    else cart.push({ ...product, pixPrice: product.pix_price, selectedSize: "", selectedColor: "", quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className={`${themeHero[theme]} text-white py-16 px-4 text-center`}>
        <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full mb-4">
          {badge}
        </span>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-3">{title}</h1>
        <p className="text-lg opacity-80">{subtitle}</p>
        {countdown && <Countdown target={countdown} />}
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-xl">Em breve!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">{products.length} produtos encontrados</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <Link href={`/produto/${product.id}`}>
                    <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden rounded-xl mb-3">
                      <Image
                        src={product.images?.[0] || ""}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.price > product.pix_price && (
                        <span
                          className="absolute top-2 left-2 text-xs font-bold text-white px-2 py-1 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        >
                          -{Math.round((1 - product.pix_price / product.price) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <p className="text-sm font-medium truncate mb-1">{product.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      {product.price > product.pix_price && (
                        <p className="text-xs text-gray-400 line-through">
                          R$ {product.price.toFixed(2).replace(".", ",")}
                        </p>
                      )}
                      <p className="font-bold" style={{ color: accentColor }}>
                        R$ {product.pix_price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="p-2 text-white rounded-lg active:scale-95 transition-all"
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
