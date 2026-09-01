"use client";

import { ApiError } from "@/src/services/api";
import * as authService from "@/src/services/authService";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(
        token ? "" : "Link inválido. Solicite a recuperação de senha novamente.",
    );
    const [done, setDone] = useState(false);
    const [show, setShow] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("As senhas não coincidem.");
            return;
        }
        if (password.length < 8) {
            setError("A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(token, password);
            setDone(true);
            setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? err.message
                    : "Não foi possível redefinir. Tente novamente.",
            );
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
                    <p className="mt-2 text-gray-500">Criar nova senha</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                    {done ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                                <CheckCircle size={26} className="text-green-600" />
                            </div>
                            <h2 className="mb-2 text-lg font-bold">Senha alterada!</h2>
                            <p className="text-sm text-gray-500">
                                Redirecionando para o login...
                            </p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Nova senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={show ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-12 focus:ring-2 focus:ring-[#8C2F39]"
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShow((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        >
                                            {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Confirmar nova senha
                                    </label>
                                    <input
                                        type="password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
                                        placeholder="Repita a senha"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8C2F39] py-3 font-semibold text-white transition-colors hover:bg-[#7a2832] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : null}
                                    {loading ? "Salvando..." : "Salvar nova senha"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
