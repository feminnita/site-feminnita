"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { subscribeNewsletter } from "../../services/newsletterService";

const STORAGE_KEY = "feminnita:newsletterPopup";
const DELAY_MS = 18000; // 18s — nunca no carregamento (tráfego de busca; interstício no load é penalizado)
// OFF por padrão: só liga quando a tabela subscribers estiver migrada e o backend pronto
const ENABLED = process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED === "true";

export function NewsletterPopup() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

    useEffect(() => {
        if (!ENABLED) return;
        let alreadySeen = false;
        try {
            alreadySeen = localStorage.getItem(STORAGE_KEY) === "1";
        } catch {
            /* localStorage indisponível — deixa mostrar */
        }
        if (alreadySeen) return;

        let fired = false;
        const cleanup = () => {
            clearTimeout(timer);
            document.removeEventListener("mouseout", onMouseOut);
        };
        const show = () => {
            if (fired) return;
            fired = true;
            try {
                localStorage.setItem(STORAGE_KEY, "1");
            } catch {
                /* ignore */
            }
            setOpen(true);
            cleanup();
        };
        // exit-intent: mouse sai pelo topo da viewport (desktop)
        const onMouseOut = (e: MouseEvent) => {
            if (e.clientY <= 0) show();
        };
        const timer = setTimeout(show, DELAY_MS);
        document.addEventListener("mouseout", onMouseOut);
        return cleanup;
    }, []);

    if (!open) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            setState("error");
            return;
        }
        setState("sending");
        try {
            await subscribeNewsletter(email, "popup");
            setState("done");
        } catch {
            setState("error");
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setOpen(false)}
        >
            <div
                className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setOpen(false)}
                    aria-label="Fechar"
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
                >
                    <X size={20} />
                </button>

                {state === "done" ? (
                    <div className="text-center">
                        <h3 className="mb-2 text-2xl font-light text-[#8C2F39]">Quase lá! ✉️</h3>
                        <p className="text-gray-600">
                            Enviamos um e-mail de confirmação. Confirme e você entra na lista de acesso antecipado.
                        </p>
                    </div>
                ) : (
                    <>
                        <h3 className="mb-2 text-2xl font-light text-[#8C2F39]">Acesso antecipado</h3>
                        <p className="mb-5 text-gray-600">
                            Receba os lançamentos da Feminnita em primeira mão — antes de aparecerem pra todo mundo.
                        </p>
                        <form onSubmit={submit} className="space-y-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:border-[#8C2F39] focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={state === "sending"}
                                className="w-full rounded-lg bg-[#8C2F39] py-3 text-sm font-medium text-[#FAF6F2] transition-colors hover:bg-[#7a2832] disabled:opacity-60"
                            >
                                {state === "sending" ? "Enviando..." : "Quero acesso antecipado"}
                            </button>
                            {state === "error" && (
                                <p className="text-center text-xs text-red-600">
                                    Confira o e-mail e tente de novo.
                                </p>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
