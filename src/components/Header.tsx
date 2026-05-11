"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Heart, User, Search } from "lucide-react";

export function Header() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    updateCartCount();

    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
    setCartCount(count);
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="bg-gray-100 py-2 text-center text-sm">
        10X SEM JUROS nos cartões de crédito
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="/produtos" className="hover:underline">PRODUTOS</Link>
            <Link href="/lancamentos" className="hover:underline">LANÇAMENTOS</Link>
            <Link href="/mais-vendidos" className="hover:underline">MAIS VENDIDOS</Link>
            <Link href="/outlet" className="hover:underline">OUTLET</Link>
          </nav>

          <Link href="/">
            <h1 className="text-2xl font-light tracking-wider">feminnita</h1>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/busca" className="hover:text-gray-600">
              <Search size={20} />
            </Link>
            <Link href="/conta" className="hover:text-gray-600">
              <User size={20} />
            </Link>
            <Link href="/favoritos" className="hover:text-gray-600 relative">
              <Heart size={20} />
            </Link>
            <Link href="/carrinho" className="hover:text-gray-600 relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
