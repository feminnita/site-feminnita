import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[480px] mx-auto px-4 py-16">
        <h1
          className="text-3xl font-extralight tracking-wider text-center mb-2"
          style={{ fontFamily: "serif", color: "#2e1a20" }}
        >
          Criar Conta
        </h1>
        <p className="text-center text-[13px] text-gray-400 mb-10">
          Junte-se à família Feminnita
        </p>

        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Sobrenome</label>
              <input
                type="text"
                placeholder="Seu sobrenome"
                className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">CPF</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Telefone</label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Senha</label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Confirmar Senha</label>
            <input
              type="password"
              placeholder="Repita a senha"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 text-white text-[12px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity mt-2"
            style={{ background: "#8C2F39" }}
          >
            Criar Conta
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-8">
          <p className="text-[13px] text-gray-500">
            Já tem conta?{" "}
            <Link href="/login" className="hover:text-[#8C2F39] transition-colors" style={{ color: "#8C2F39" }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
