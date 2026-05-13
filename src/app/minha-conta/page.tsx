"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const sideNav = [
  { label: "Meus Pedidos",  href: "/minha-conta/pedidos" },
  { label: "Meus Dados",    href: "/minha-conta/dados" },
  { label: "Endereços",     href: "/minha-conta/enderecos" },
  { label: "Favoritos",     href: "/minha-conta/favoritos" },
];

export default function MinhaContaPage() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#8C2F39] animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[400px] mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-extralight mb-4" style={{ fontFamily: "serif" }}>Minha Conta</h1>
          <p className="text-[13px] text-gray-500 mb-8">Faça login para acessar sua conta.</p>
          <Link href="/login" className="inline-block text-white text-[12px] uppercase tracking-[0.2em] px-10 py-4 hover:opacity-90 transition-opacity"
            style={{ background: "#8C2F39" }}>
            Entrar
          </Link>
          <div className="mt-4">
            <Link href="/cadastro" className="text-[12px] text-gray-400 hover:text-gray-600">
              Criar conta
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <h1 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-600 mb-8">
          Minha Conta
        </h1>

        {welcome && (
          <div className="mb-6 px-4 py-3 text-[13px] text-green-700 bg-green-50 border border-green-200">
            Conta criada com sucesso! Bem-vinda à Feminnita 🌸
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="border border-gray-100 p-4 mb-4">
              <p className="text-[13px] font-semibold text-gray-800">{user.name}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">{user.email}</p>
            </div>
            <nav className="space-y-0.5">
              {sideNav.map((item) => (
                <Link key={item.href} href={item.href}
                  className="block px-4 py-3 text-[13px] text-gray-600 border-b border-gray-50 hover:text-[#8C2F39] hover:bg-[#fff8f8] transition-colors">
                  {item.label}
                </Link>
              ))}
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-[13px] text-gray-400 hover:text-red-500 transition-colors">
                Sair
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="border border-gray-100 p-8">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-700 mb-6">
                Olá, {user.name?.split(" ")[0]}!
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Meus Pedidos", href: "/minha-conta/pedidos", icon: "📦" },
                  { label: "Meus Dados",   href: "/minha-conta/dados",   icon: "👤" },
                  { label: "Favoritos",    href: "/minha-conta/favoritos", icon: "❤️" },
                ].map((card) => (
                  <Link key={card.href} href={card.href}
                    className="border border-gray-100 p-6 text-center hover:border-[#8C2F39] hover:bg-[#fff8f8] transition-colors">
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <p className="text-[13px] text-gray-700">{card.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
