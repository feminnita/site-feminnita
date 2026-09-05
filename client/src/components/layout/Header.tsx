"use client";

import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/count/useAuth";
import { useCart } from "../../hooks/cart/useCart";
import { fetchCategories } from "../../services/categoriesService";
import { fetchProducts } from "../../services/productsService";
import { buildTree, cleanCategoryTree } from "../../utils/categories";
import type { CategoryNode } from "../../types/categories/categories";
import { CategoryDropdown, MobileCategoryAccordion } from "./CategoryNav";

// Marcadores (flags) do produto — faixa própria abaixo da barra principal, separada
// dos menus de categoria. Cada um só aparece se houver >=1 produto com aquela flag
// (verificado ao vivo) — faixa que leva a página vazia é pior que faixa faltando.
// Assim MAIS VENDIDOS e OUTLET nascem escondidos e aparecem sozinhos no minuto em
// que a cliente marcar a primeira peça, sem deploy. LANÇAMENTOS tem produto, fica.
const MARKER_TABS: {
  flag: "is_new" | "is_bestseller" | "is_outlet";
  href: string;
  label: string;
}[] = [
  { flag: "is_new", href: "/lancamentos", label: "LANÇAMENTOS" },
  { flag: "is_bestseller", href: "/mais-vendidos", label: "MAIS VENDIDOS" },
  { flag: "is_outlet", href: "/outlet", label: "OUTLET" },
];

export function Header() {
  const router = useRouter();
  const { count: cartCount } = useCart();
  const { customer, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  // Começa só com LANÇAMENTOS (tem produto) para não piscar; o efeito confirma
  // ao vivo e adiciona MAIS VENDIDOS / OUTLET se tiverem >=1 produto com a flag.
  const [markerTabs, setMarkerTabs] = useState<{ href: string; label: string }[]>([
    { href: "/lancamentos", label: "LANÇAMENTOS" },
  ]);

  useEffect(() => {
    fetchCategories()
      .then((rows) => setCategoryTree(cleanCategoryTree(buildTree(rows))))
      .catch(() => setCategoryTree([]));
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all(
      MARKER_TABS.map(async (t) => {
        try {
          const prods = await fetchProducts({ flag: t.flag, limit: 1 });
          return prods.length > 0
            ? { href: t.href, label: t.label }
            : null;
        } catch {
          return null;
        }
      }),
    ).then((res) => {
      if (alive) setMarkerTabs(res.filter((x): x is { href: string; label: string } => x !== null));
    });
    return () => {
      alive = false;
    };
  }, []);

  const firstName = customer?.name.split(" ")[0];

  const handleLogout = async () => {
    await logout();
    toast.success("Você saiu da conta");
    router.push("/");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    setMenuOpen(false);
    router.push(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
  };

  return (
    // Com itens no carrinho, a MinOrderBar fica sticky no topo (48px) no desktop;
    // o header desce para md:top-12 e os dois se empilham sem se sobrepor.
    <header
      className={`sticky top-0 z-50 border-b bg-white ${cartCount > 0 ? "md:top-12" : ""}`}
    >
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
              {/* PRODUTOS: dropdown com a árvore de categorias no hover */}
              <div className="group/prod relative">
                <Link
                  href="/produtos"
                  className="flex items-center gap-1 hover:underline"
                >
                  PRODUTOS
                  <ChevronDown size={14} className="text-gray-400" />
                </Link>
                {categoryTree.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 pt-4 opacity-0 transition-all duration-150 group-hover/prod:visible group-hover/prod:opacity-100">
                    <div className="w-[min(56rem,88vw)] rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
                      <CategoryDropdown tree={categoryTree} />
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Busca aberta (desktop) */}
          <form
            onSubmit={handleSearch}
            className="mx-6 hidden max-w-md flex-1 items-center rounded-full border border-gray-300 bg-white pl-4 pr-1 focus-within:border-[#8C2F39] md:flex"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="O que você está procurando?"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8C2F39] text-white transition-colors hover:bg-[#7a2832]"
            >
              <Search size={16} />
            </button>
          </form>

          <div className="flex items-center justify-end gap-2 sm:gap-4">
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
            <Link
              href="/carrinho"
              className="relative -m-2 p-2.5 hover:text-gray-600"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Busca aberta (mobile) — campo visível, não ícone */}
        <form
          onSubmit={handleSearch}
          className="mt-3 flex items-center rounded-full border border-gray-300 bg-white pl-4 pr-1 focus-within:border-[#8C2F39] md:hidden"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="O que você está procurando?"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8C2F39] text-white transition-colors hover:bg-[#7a2832]"
          >
            <Search size={16} />
          </button>
        </form>

        {menuOpen && (
          <nav className="mt-4 flex flex-col gap-1 border-t pt-4 lg:hidden">
            <Link
              href="/produtos"
              onClick={() => setMenuOpen(false)}
              className="py-2 text-sm font-semibold uppercase tracking-wide text-[#8C2F39]"
            >
              Produtos
            </Link>
            <MobileCategoryAccordion
              tree={categoryTree}
              onNavigate={() => setMenuOpen(false)}
            />

            {markerTabs.length > 0 && (
              <div className="mt-1 border-t pt-2">
                {markerTabs.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm font-semibold uppercase tracking-wide text-[#8C2F39] hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

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

      {/* Faixa dos MARCADORES — segunda barra própria, largura total, centralizada e
          destacada dos menus de categoria. Só no desktop (mobile usa o menu lateral).
          Cada marcador só aparece com >=1 produto naquela flag (checagem ao vivo). */}
      {markerTabs.length > 0 && (
        <div className="hidden border-t border-gray-200 bg-[#8C2F39]/[0.06] lg:block">
          <nav className="container mx-auto flex items-center justify-center gap-10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest">
            {markerTabs.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#8C2F39] transition-colors hover:text-[#7a2832] hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
