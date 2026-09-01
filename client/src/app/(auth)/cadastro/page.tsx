"use client";

import { ApiError } from "@/src/services/api";
import { GOOGLE_LOGIN_URL } from "@/src/services/authService";
import { useAuth } from "@/src/hooks/count/useAuth";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CadastroPage() {
    const router = useRouter();
    const { register } = useAuth();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirm) {
            setError("As senhas não coincidem.");
            return;
        }
        if (form.password.length < 8) {
            setError("A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await register(form.name, form.email, form.password);
            router.push("/");
            router.refresh();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Erro ao criar a conta.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAF6F2] p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/">
                        <h1 className="text-3xl font-bold tracking-widest text-[#1A1A1A]">
                            FEMINNITA
                        </h1>
                    </Link>
                    <p className="mt-2 text-gray-500">Crie sua conta</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                    {error && (
                        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <a
                        href={GOOGLE_LOGIN_URL}
                        className="mb-5 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Cadastrar com Google
                    </a>

                    <div className="mb-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-400">ou com e-mail</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Nome completo *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, name: e.target.value }))
                                }
                                required
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                E-mail *
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, email: e.target.value }))
                                }
                                required
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Senha *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, password: e.target.value }))
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-12 focus:ring-2 focus:ring-[#8C2F39]"
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Confirmar senha *
                            </label>
                            <input
                                type="password"
                                value={form.confirm}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, confirm: e.target.value }))
                                }
                                required
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
                                placeholder="Repita a senha"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8C2F39] py-3 font-semibold text-white transition-colors hover:bg-[#7a2832] disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                            {loading ? "Criando conta..." : "Criar conta"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Já tem conta?{" "}
                            <Link
                                href="/login"
                                className="font-medium text-[#8C2F39] hover:underline"
                            >
                                Entrar
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
                        ← Voltar para a loja
                    </Link>
                </p>
            </div>
        </div>
    );
}
