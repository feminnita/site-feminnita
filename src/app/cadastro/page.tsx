"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CadastroPage() {
  const [form, setForm] = useState({ nome: "", sobrenome: "", email: "", cpf: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("As senhas não coincidem."); return; }
    if (form.password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: `${form.nome} ${form.sobrenome}`.trim(),
          phone: form.phone,
          cpf: form.cpf,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message === "User already registered"
        ? "E-mail já cadastrado. Faça login."
        : "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    // Insert into customers table
    if (data.user) {
      await supabase.from("customers").upsert({
        auth_id: data.user.id,
        name: `${form.nome} ${form.sobrenome}`.trim(),
        email: form.email,
        phone: form.phone,
        cpf: form.cpf,
      });
    }

    router.push("/minha-conta?welcome=1");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[480px] mx-auto px-4 py-16">
        <h1 className="text-3xl font-extralight tracking-wider text-center mb-2"
          style={{ fontFamily: "serif", color: "#2e1a20" }}>
          Criar Conta
        </h1>
        <p className="text-center text-[13px] text-gray-400 mb-10">Junte-se à família Feminnita</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Nome</label>
              <input required value={form.nome} onChange={set("nome")} type="text"
                className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Sobrenome</label>
              <input required value={form.sobrenome} onChange={set("sobrenome")} type="text"
                className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">E-mail</label>
            <input required value={form.email} onChange={set("email")} type="email"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">CPF</label>
            <input value={form.cpf} onChange={set("cpf")} type="text" placeholder="000.000.000-00"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">WhatsApp</label>
            <input value={form.phone} onChange={set("phone")} type="tel" placeholder="(11) 99999-9999"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Senha</label>
            <input required value={form.password} onChange={set("password")} type="password" placeholder="Mínimo 8 caracteres"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Confirmar Senha</label>
            <input required value={form.confirm} onChange={set("confirm")} type="password" placeholder="Repita a senha"
              className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
          </div>

          {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 text-white text-[12px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
            style={{ background: "#8C2F39" }}>
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-8">
          <p className="text-[13px] text-gray-500">
            Já tem conta?{" "}
            <Link href="/login" className="hover:underline" style={{ color: "#8C2F39" }}>Entrar</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
