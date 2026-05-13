"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";

const navLinks = [
  { label: "PIJAMAS", href: "/colecao/pijamas" },
  { label: "CAMISOLAS", href: "/colecao/camisolas" },
  { label: "SHORTS DOLL", href: "/colecao/shorts-doll" },
  { label: "CONJUNTOS", href: "/colecao/conjuntos" },
  { label: "OUTLET", href: "/colecao/outlet" },
];

export function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0));
    };
    update();
    window.addEventListener("cartUpdated", update);
    return () => window.removeEventListener("cartUpdated", update);
  }, []);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-[#f5f0eb] text-center py-2 text-[11px] tracking-widest uppercase text-gray-700">
        Frete grátis acima de R$ 299 &nbsp;|&nbsp; 3x sem juros no cartão
      </div>

      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-5 grid grid-cols-3 items-center">

          {/* Left — desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-medium tracking-widest text-gray-800 hover:text-[#8C2F39] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Left — mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
          </div>

          {/* Center — Logo */}
          <Link href="/" className="flex justify-center">
            <span className="text-[26px] font-light tracking-[0.18em] text-[#8C2F39] select-none">
              feminnita
            </span>
          </Link>

          {/* Right — icons */}
          <div className="flex items-center justify-end gap-5">
            <button onClick={() => setSearchOpen(!searchOpen)} className="hover:text-[#8C2F39] transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link href="/minha-conta" className="hover:text-[#8C2F39] transition-colors hidden md:block">
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/favoritos" className="hover:text-[#8C2F39] transition-colors hidden md:block">
              <Heart size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/carrinho" className="hover:text-[#8C2F39] transition-colors relative">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#8C2F39] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center gap-3 max-w-[1400px] mx-auto">
            <Search size={16} className="text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="O que você está procurando?"
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
            <button onClick={() => setSearchOpen(false)}>
              <X size={18} className="text-gray-400 hover:text-gray-700" />
            </button>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <span className="text-[22px] font-light tracking-widest text-[#8C2F39]">feminnita</span>
            <button onClick={() => setMobileOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col px-6 py-8 gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium tracking-widest uppercase text-gray-800 border-b border-gray-100 pb-4"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-6 px-6 mt-auto pb-10">
            <Link href="/minha-conta" onClick={() => setMobileOpen(false)}><User size={22} /></Link>
            <Link href="/favoritos" onClick={() => setMobileOpen(false)}><Heart size={22} /></Link>
            <Link href="/carrinho" onClick={() => setMobileOpen(false)}><ShoppingBag size={22} /></Link>
          </div>
        </div>
      )}
    </>
  );
}
