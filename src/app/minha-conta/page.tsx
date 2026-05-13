import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function MinhaContaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <h1 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-600 mb-8">
          Minha Conta
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="space-y-1">
              {[
                { label: "Meus Pedidos", href: "/minha-conta/pedidos" },
                { label: "Meus Dados", href: "/minha-conta/dados" },
                { label: "Endereços", href: "/minha-conta/enderecos" },
                { label: "Favoritos", href: "/minha-conta/favoritos" },
                { label: "Sair", href: "/login" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-[13px] text-gray-600 border-b border-gray-50 hover:text-[#8C2F39] hover:bg-[#fff8f8] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="border border-gray-100 p-8 text-center">
              <p className="text-gray-400 text-sm mb-4">Você não está logada.</p>
              <Link
                href="/login"
                className="inline-block text-white text-[11px] uppercase tracking-[0.2em] px-10 py-3 hover:opacity-90 transition-opacity"
                style={{ background: "#8C2F39" }}
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
