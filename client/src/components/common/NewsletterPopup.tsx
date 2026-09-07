"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

// Pop-up de captura de e-mail. É a porta de entrada da lista própria da
// Feminnita — nada de empresa terceirizada no meio.
//
// Regras de bom-mocismo, para não irritar quem está comprando:
//  - só aparece depois de ATRASO_MS na página, nunca de cara;
//  - some para sempre depois que a pessoa se inscreve;
//  - quem fecha sem se inscrever só volta a ver depois de DIAS_ATE_REAPARECER;
//  - não aparece no checkout nem no carrinho, onde atrapalharia a venda.
const ATRASO_MS = 12000;
const DIAS_ATE_REAPARECER = 15;
const CHAVE = "feminnita:newsletter";

type Estado = { inscrito?: boolean; fechadoEm?: number };

function ler(): Estado {
    try {
        return JSON.parse(localStorage.getItem(CHAVE) || "{}") as Estado;
    } catch {
        return {};
    }
}

function gravar(e: Estado) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(e));
    } catch {
        /* navegador anônimo ou storage bloqueado: só não lembra, e tudo bem */
    }
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export function NewsletterPopup() {
    const [aberto, setAberto] = useState(false);
    const [email, setEmail] = useState("");
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        const caminho = window.location.pathname;
        if (caminho.startsWith("/checkout") || caminho.startsWith("/carrinho")) return;

        const estado = ler();
        if (estado.inscrito) return;
        if (estado.fechadoEm && Date.now() - estado.fechadoEm < DIAS_ATE_REAPARECER * 864e5) return;

        const t = setTimeout(() => setAberto(true), ATRASO_MS);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!aberto) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [aberto]);

    function fechar() {
        setAberto(false);
        gravar({ ...ler(), fechadoEm: Date.now() });
    }

    async function enviar(e: React.FormEvent) {
        e.preventDefault();
        if (enviando) return;
        setEnviando(true);
        try {
            const r = await fetch(`${API}/api/store/newsletter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "popup" }),
            });
            if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error(body.error || "Não foi possível concluir a inscrição.");
            }
            gravar({ inscrito: true });
            setAberto(false);
            toast.success("Pronto! Você vai receber as novidades em primeira mão.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Não foi possível concluir a inscrição.");
        } finally {
            setEnviando(false);
        }
    }

    if (!aberto) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-titulo"
            onClick={fechar}
        >
            <div
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={fechar}
                    aria-label="Fechar"
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                    <X size={18} />
                </button>

                <div className="px-7 py-9">
                    <h2
                        id="newsletter-titulo"
                        className="text-2xl font-semibold leading-snug text-gray-900"
                    >
                        Quer receber as novidades da Feminnita em primeira mão?
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        Cadastre-se e receba lançamentos, promoções para revenda e conteúdo
                        exclusivo antes de todo mundo.
                    </p>

                    <form onSubmit={enviar} className="mt-6">
                        <label htmlFor="newsletter-email" className="sr-only">
                            Seu e-mail
                        </label>
                        <input
                            id="newsletter-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Seu e-mail"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8C2F39]"
                        />
                        <button
                            type="submit"
                            disabled={enviando}
                            className="mt-3 w-full rounded-xl bg-[#8C2F39] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7a2832] disabled:opacity-60"
                        >
                            {enviando ? "Enviando..." : "Inscreva-se"}
                        </button>
                    </form>

                    <p className="mt-4 text-center text-xs text-gray-500">
                        Ao se inscrever, você concorda com a nossa{" "}
                        <a href="/politica-de-privacidade" className="underline hover:text-gray-700">
                            Política de Privacidade
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
