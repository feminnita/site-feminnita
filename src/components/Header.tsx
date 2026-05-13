"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  const [cartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleMouseEnter = (label: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
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
          <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="p-4">
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
                      className="block py-1.5 text-xs text-gray-500 hover:text-gray-800"
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

      {/* Top benefit bar */}
      <div className="w-full bg-white border-b border-gray-100 hidden md:block">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between py-2">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C2F39" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">Frete grátis</span> acima de R$299
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C2F39" strokeWidth="1.5">
                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span className="text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">Parcelamento</span> em até 10x sem juros
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C2F39" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">PIX</span> com 10% de desconto
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <Link href="/minha-conta" className="hover:text-gray-800">Minha Conta</Link>
            <Link href="/cadastro" className="hover:text-gray-800">Cadastre-se</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className="bg-white sticky top-0 z-30"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
      >
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-[70px]">
          {/* Hamburger */}
          <button
            className="md:hidden p-2 flex flex-col gap-[5px]"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <span className="block w-5 h-[2px] bg-gray-800" />
            <span className="block w-5 h-[2px] bg-gray-800" />
            <span className="block w-5 h-[2px] bg-gray-800" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-light tracking-[0.2em] uppercase absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
            style={{ color: "#8C2F39", fontFamily: "serif" }}
          >
            feminnita
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.items ? handleMouseEnter(item.label) : null}
                onMouseLeave={item.items ? handleMouseLeave : undefined}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-3 text-[14px] leading-[70px] whitespace-nowrap transition-colors duration-200"
                  style={{
                    color: item.outlet ? "#8C2F39" : "#333",
                    fontWeight: item.outlet ? 700 : 400,
                  }}
                >
                  {item.label}
                  {item.items && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </Link>

                {/* Dropdown */}
                {item.items && activeDropdown === item.label && (
                  <div
                    className="absolute top-full left-0 bg-white shadow-lg min-w-[180px] z-50 py-2"
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.items.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block px-4 py-2 text-[13px] text-gray-700 hover:bg-[#fef0f7] hover:text-[#8C2F39] transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <div className="flex items-center border-b border-gray-300">
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      window.location.href = `/busca?q=${encodeURIComponent(searchQuery.trim())}`;
                    }
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                  placeholder="Buscar produtos..."
                  className="text-[13px] w-40 outline-none py-1 px-1"
                />
                <button onClick={() => setSearchOpen(false)} className="p-1 text-gray-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex flex-col items-center gap-0.5 text-[11px] text-gray-500 hover:text-[#8C2F39] transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            )}

            <Link
              href="/minha-conta/favoritos"
              className="flex flex-col items-center gap-0.5 text-[11px] text-gray-500 hover:text-[#8C2F39] transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>

            <Link
              href="/carrinho"
              className="flex flex-col items-center gap-0.5 text-[11px] text-gray-500 hover:text-[#8C2F39] transition-colors relative"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center" style={{ background: "#8C2F39" }}>
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/minha-conta"
              className="hidden md:flex flex-col items-center gap-0.5 text-[11px] text-gray-500 hover:text-[#8C2F39] transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
