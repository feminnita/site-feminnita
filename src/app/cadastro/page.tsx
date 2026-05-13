"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const inp = "w-full border border-gray-200 px-4 py-3 text-[13px] focus:outline-none focus:border-gray-500";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const set = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("As senhas não coincidem."); return; }
    if (form.password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name }, emailRedirectTo: `${window.location.origin}/minha-conta` },
    });

    if (authError) {
      setError(authError.message === "User already registered"
        ? "Este e-mail já está cadastrado. Tente fazer login."
        : authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from("customers").insert({
        auth_id: authData.user.id,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        cpf: form.cpf.replace(/\D/g, "") || null,
      });
    }

    setLoading(false);
    router.push("/minha-conta?cadastro=ok");
  };

  return (
    <div className="min-h-screen bg-[#faf7f4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-[26px] font-light tracking-[0.3em] uppercase text-[#8C2F39]">feminnita</span>
          </Link>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-2">Criar conta</p>
        </div>

        <div className="bg-white border border-gray-100 p-8">
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Nome completo *</label>
              <input name="name" type="text" required value={form.name} onChange={set} placeholder="Seu nome completo" className={inp} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">E-mail *</label>
              <input name="email" type="email" required value={form.email} onChange={set} placeholder="seu@email.com" className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Telefone</label>
                <input name="phone" type="tel" value={form.phone} onChange={set} placeholder="(11) 99999-9999" className={inp} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">CPF</label>
                <input name="cpf" type="text" value={form.cpf} onChange={set} placeholder="000.000.000-00" className={inp} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Senha *</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={set}
                  placeholder="Mínimo 6 caracteres"
                  className={`${inp} pr-11`}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Confirmar senha *</label>
              <input name="confirm" type="password" required value={form.confirm} onChange={set} placeholder="Repita a senha" className={inp} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gray-900 text-white text-[11px] uppercase tracking-widest py-3.5 hover:bg-[#8C2F39] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Criando conta…" : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-[12px] text-gray-500">
              Já tem conta?{" "}
              <Link href="/login" className="text-[#8C2F39] hover:underline">Entrar</Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-[11px] text-gray-400 uppercase tracking-widest hover:text-gray-600">
            ← Voltar para a loja
          </Link>
        </p>
      </div>
    </div>
  );
}
