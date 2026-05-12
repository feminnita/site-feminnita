"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ShoppingCart } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  pix_price?: number;
  pixPrice?: number;
  images: string[];
  category: string;
};

function addToCart(product: Product) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((i: any) => i.id === product.id);
  if (idx > -1) cart[idx].quantity += 1;
  else cart.push({ ...product, pixPrice: product.pix_price ?? product.pixPrice, selectedSize: "", selectedColor: "", quantity: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export function PersonalizedRecommendations({
  allProducts,
  currentProductId,
  title = "Selecionado para você",
}: {
  allProducts: Product[];
  currentProductId?: string;
  title?: string;
}) {
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const viewedRaw = localStorage.getItem("viewed_products");
        const cartRaw = localStorage.getItem("cart");
        const viewedProducts = viewedRaw ? JSON.parse(viewedRaw) : [];
        const cartProducts = cartRaw ? JSON.parse(cartRaw) : [];

        const res = await fetch("/api/ai/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewedProducts,
            cartProducts,
            currentProductId,
            allProducts: allProducts.slice(0, 80),
          }),
        });

        const data = await res.json();
        const recs = (data.ids as string[])
          .map((id) => allProducts.find((p) => p.id === id))
          .filter(Boolean) as Product[];

        setRecommended(recs.slice(0, 4));
        if (data.reason) setReason(data.reason);
      } catch {
        // Fallback: random non-viewed products
        const viewedRaw = localStorage.getItem("viewed_products");
        const viewed = viewedRaw ? JSON.parse(viewedRaw) : [];
        const fallback = allProducts
          .filter((p) => !viewed.includes(p.id) && p.id !== currentProductId)
          .slice(0, 4);
        setRecommended(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [currentProductId]);

  // Track product view
  useEffect(() => {
    if (!currentProductId) return;
    const key = "viewed_products";
    const viewed = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    if (!viewed.includes(currentProductId)) {
      localStorage.setItem(key, JSON.stringify([...viewed.slice(-19), currentProductId]));
    }
  }, [currentProductId]);

  if (loading) {
    return (
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={18} className="text-[#8C2F39]" />
          <h2 className="text-xl font-light">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-xl mb-2" />
              <div className="h-3 bg-gray-100 rounded mb-1" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommended.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={18} className="text-[#8C2F39]" />
        <h2 className="text-xl font-light">{title}</h2>
      </div>
      {reason && <p className="text-sm text-gray-500 mb-5 italic">{reason}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommended.map((product) => {
          const price = product.pix_price ?? product.pixPrice ?? product.price;
          return (
            <div key={product.id} className="group">
              <Link href={`/produto/${product.id}`}>
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                  <Image
                    src={product.images?.[0] || ""}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <p className="text-sm font-medium truncate mb-1">{product.name}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#8C2F39]">
                  R$ {price.toFixed(2).replace(".", ",")}
                </p>
                <button
                  onClick={() => {
                    addToCart(product);
                    setAdded(product.id);
                    setTimeout(() => setAdded(null), 1800);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    added === product.id ? "bg-green-500 text-white" : "bg-[#8C2F39] text-white hover:bg-[#7a2832]"
                  }`}
                >
                  <ShoppingCart size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
