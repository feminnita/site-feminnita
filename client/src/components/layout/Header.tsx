"use client";

import { Heart, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../hooks/count/useAuth";
import { useCart } from "../../hooks/cart/useCart";
import { CartDrawer } from "../cart/CartDrawer";

const NAV_LINKS = [
  { href: "/produtos", label: "PRODUTOS" },
  { href: "/lancamentos", label: "LANÇAMENTOS" },
  { href: "/mais-vendidos", label: "MAIS VENDIDOS" },
  { href: "/promocao", label: "PROMOÇÃO" },
];

export function Header() {
  const router = useRouter();
  const { count: cartCount, openDrawer } = useCart();
  const { customer, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const firstName = customer?.name.split(" ")[0];

  const handleLogout = async () => {
    await logout();
    toast.success("Você saiu da conta");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="bg-gray-100 py-2 text-center text-sm">
        3X SEM JUROS nos cartões de crédito
      </div>
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="-m-2 p-2 text-gray-700 hover:text-gray-900 lg:hidden"
              aria-label="Abrir menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              href="/"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0"
            >
              <h1 className="text-xl font-light tracking-wider text-[#8C2F39] sm:text-2xl">
                Feminnita
              </h1>
            </Link>

            <nav className="hidden gap-6 text-sm font-medium lg:flex lg:items-center">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-4">
            <Link href="/busca" className="-m-2 p-2.5 hover:text-gray-600">
              <Search size={20} />
            </Link>

            {customer ? (
              <div className="group relative hidden sm:block">
                <Link
                  href="/minha-conta"
                  className="-m-2 flex items-center gap-1.5 p-2.5 hover:text-gray-600"
                >
                  <User size={20} />
                  <span className="max-w-[100px] truncate text-sm font-medium">
                    {firstName}
                  </span>
                </Link>

                <div className="invisible absolute right-0 top-full pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    <Link
                      href="/minha-conta"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={15} />
                      Minha conta
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut size={15} />
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="-m-2 hidden p-2.5 hover:text-gray-600 sm:block"
                title="Entrar"
              >
                <User size={20} />
              </Link>
            )}

            <Link
              href="/favoritos"
              className="relative -m-2 hidden p-2.5 hover:text-gray-600 sm:block"
            >
              <Heart size={20} />
            </Link>
            <button
              type="button"
              onClick={openDrawer}
              className="relative -m-2 p-2.5 hover:text-gray-600"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mt-4 flex flex-col gap-1 border-t pt-4 lg:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm font-medium text-gray-700 hover:text-[#8C2F39]"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-1 flex gap-1 border-t pt-3 sm:hidden">
              <Link
                href={customer ? "/minha-conta" : "/login"}
                onClick={() => setMenuOpen(false)}
                className="flex flex-1 items-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-700 hover:text-[#8C2F39]"
              >
                <User size={18} />
                {customer ? `Olá, ${firstName}` : "Entrar / Criar conta"}
              </Link>
              <Link
                href="/favoritos"
                onClick={() => setMenuOpen(false)}
                className="flex flex-1 items-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-700 hover:text-[#8C2F39]"
              >
                <Heart size={18} />
                Favoritos
              </Link>
            </div>
            {customer && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700 hover:text-red-600 sm:hidden"
              >
                <LogOut size={18} />
                Sair
              </button>
            )}
          </nav>
        )}
      </div>

      <CartDrawer />
    </header>
  );
}
