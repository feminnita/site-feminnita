"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Image,
  Settings,
  Users,
  ChevronRight,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tag },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/slides", label: "Carrossel Hero", icon: Image },
  { href: "/admin/cupons", label: "Cupons", icon: Tag },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="block">
            <span className="text-xl font-bold tracking-widest">FEMINNITA</span>
            <p className="text-xs text-gray-400 mt-1">Painel Administrativo</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-[#8C2F39] text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
                {active && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Ver o site</span>
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
