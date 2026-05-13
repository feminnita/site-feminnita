"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/minha-conta";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[400px] mx-auto px-4 py-16">
        <h1 className="text-3xl font-extralight tracking-wider text-center mb-2"
          style={{ fontFamily: "serif", color: "#2e1a20" }}>
          Entrar
        </h1>
        <p className="text-center text-[13px] text-gray-400 mb-10">Acesse sua conta Feminnita</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-500 text-center">{error}</p>
          )}

          <div className="flex justify-end">
            <Link href="/recuperar-senha" className="text-[12px] text-gray-400 hover:text-gray-600">
              Esqueci minha senha
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white text-[12px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: "#8C2F39" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-8">
          <p className="text-[13px] text-gray-500 mb-4">Ainda não tem conta?</p>
          <Link href="/cadastro" className="inline-block border text-[11px] uppercase tracking-[0.2em] px-10 py-3 hover:bg-gray-800 hover:text-white transition-colors"
            style={{ borderColor: "#333", color: "#333" }}>
            Criar Conta
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
