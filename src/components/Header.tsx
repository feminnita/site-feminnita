"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";

const nav = [
  {
    label: "Pijamas",
    href: "/colecao/pijamas",
    items: [
      { label: "Pijama Curto", href: "/colecao/pijamas?tipo=curto" },
      { label: "Pijama Longo", href: "/colecao/pijamas?tipo=longo" },
      { label: "Pijama Manga Longa", href: "/colecao/pijamas?tipo=manga-longa" },
      { label: "Pijama Inverno", href: "/colecao/pijamas?tipo=inverno" },
    ],
  },
  {
    label: "Camisolas",
    href: "/colecao/camisolas",
    items: [
      { label: "Camisola Curta", href: "/colecao/camisolas?tipo=curta" },
      { label: "Camisola Longa", href: "/colecao/camisolas?tipo=longa" },
      { label: "Camisola com Renda", href: "/colecao/camisolas?tipo=renda" },
      { label: "Camisola Cetim", href: "/colecao/camisolas?tipo=cetim" },
    ],
  },
  {
    label: "Shorts Doll",
    href: "/colecao/shorts-doll",
    items: [
      { label: "Short Doll Estampado", href: "/colecao/shorts-doll?tipo=estampado" },
      { label: "Short Doll com Renda", href: "/colecao/shorts-doll?tipo=renda" },
    ],
  },
  {
    label: "Conjuntos",
    href: "/colecao/conjuntos",
    items: [
      { label: "Conjunto Xadrez", href: "/colecao/conjuntos?tipo=xadrez" },
      { label: "Conjunto Curto", href: "/colecao/conjuntos?tipo=curto" },
    ],
  },
  { label: "Lançamentos", href: "/colecao/lancamentos" },
  { label: "Outlet", href: "/colecao/outlet", outlet: true },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { count } = useCart();

  const handleMouseEnter = (label: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setActiveDropdown(label);
  };
  const handleMouseLeave = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="text-xl font-light tracking-[0.2em] uppercase"
            style={{ color: "#8C2F39", fontFamily: "serif" }}
          >
            feminnita
          </Link>
          <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="p-4 overflow-y-auto">
          {nav.map((item) => (
            <div key={item.label} className="border-b border-gray-50">
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm tracking-wide"
                style={{ color: item.outlet ? "#8C2F39" : "#333", fontWeight: item.outlet ? 700 : 400 }}
              >
                {item.label}
              </Link>
              {item.items && (
                <div className="pl-4 pb-2">
                  {item.items.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-1.5 text-xs text-gray-400 hover:text-gray-700"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Top benefit bar — igual Ange */}
      <div className="w-full border-b border-gray-100" style={{ background: "#f8f8f8" }}>
        <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-center gap-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
            <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span className="text-[12px] text-gray-600">
            <strong>FRETE GRÁTIS</strong> acima de R$299
          </span>
        </div>
      </div>

      {/* Main header: NAV LEFT | LOGO CENTER | SEARCH+ICONS RIGHT */}
      <header
        className="bg-white sticky top-0 z-30"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.07)" }}
      >
        <div className="max-w-[1400px] mx-auto px-4 flex items-center h-[68px]">

          {/* LEFT — hamburger (mobile) + desktop nav */}
          <div className="flex items-center flex-1">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 mr-2 flex flex-col gap-[5px]"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <span className="block w-5 h-[2px] bg-gray-800" />
              <span className="block w-5 h-[2px] bg-gray-800" />
              <span className="block w-5 h-[2px] bg-gray-800" />
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center">
              {nav.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.items ? handleMouseEnter(item.label) : undefined}
                  onMouseLeave={item.items ? handleMouseLeave : undefined}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-0.5 px-3 text-[13px] font-medium leading-[68px] whitespace-nowrap uppercase tracking-wide transition-colors duration-150 hover:text-[#8C2F39]"
                    style={{
                      color: item.outlet ? "#8C2F39" : "#222",
                      fontWeight: item.outlet ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </Link>

                  {/* Dropdown */}
                  {item.items && activeDropdown === item.label && (
                    <div
                      className="absolute top-full left-0 bg-white min-w-[190px] z-50 py-2"
                      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
                      onMouseEnter={() => handleMouseEnter(item.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {item.label}
                      </div>
                      {item.items.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-4 py-2 text-[13px] text-gray-600 hover:bg-[#fff5f6] hover:text-[#8C2F39] transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* CENTER — Logo */}
          <div className="flex-shrink-0 px-4">
            <Link
              href="/"
              className="text-2xl font-light tracking-[0.25em] uppercase"
              style={{ color: "#8C2F39", fontFamily: "serif", letterSpacing: "0.22em" }}
            >
              feminnita
            </Link>
          </div>

          {/* RIGHT — Search + Icons */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* Search bar — igual Ange */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center border border-gray-200 rounded-full overflow-hidden"
              style={{ background: "#f8f8f8" }}
            >
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você está procurando?"
                className="text-[12px] px-4 py-2 w-48 outline-none bg-transparent text-gray-700 placeholder-gray-400"
              />
              <button type="submit" className="px-3 py-2 text-gray-400 hover:text-gray-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>

            {/* Person */}
            <Link
              href="/minha-conta"
              className="text-gray-500 hover:text-[#8C2F39] transition-colors"
              aria-label="Minha conta"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Heart */}
            <Link
              href="/minha-conta/favoritos"
              className="text-gray-500 hover:text-[#8C2F39] transition-colors"
              aria-label="Favoritos"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/carrinho"
              className="relative text-gray-500 hover:text-[#8C2F39] transition-colors"
              aria-label="Carrinho"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {count > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none"
                  style={{ background: "#8C2F39" }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            {/* Mobile search icon */}
            <button
              className="md:hidden text-gray-500"
              onClick={() => router.push("/busca")}
              aria-label="Buscar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

        </div>
      </header>
    </>
  );
}
