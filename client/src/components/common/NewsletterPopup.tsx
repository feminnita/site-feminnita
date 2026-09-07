"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { fetchSettings } from "../../services/settingsService";

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

// Grupo VIP fica no site_settings (chave grupo_vip) para a Chris trocar o link
// sem mexer em código — link de grupo de WhatsApp vence e é refeito direto.
type GrupoVip = { url?: string; titulo?: string; descricao?: string };

export function NewsletterPopup() {
    const [aberto, setAberto] = useState(false);
    const [email, setEmail] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [vip, setVip] = useState<GrupoVip | null>(null);
    const [inscrito, setInscrito] = useState(false);

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
        if (!aberto || vip) return;
        fetchSettings()
            .then((s) => setVip((s?.grupo_vip as GrupoVip) || {}))
            .catch(() => setVip({}));
    }, [aberto, vip]);

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
            // Quem acabou de dizer sim é quem mais entra no grupo VIP — o
            // convite vem aqui, não numa página que ninguém procura.
            if (vip?.url) {
                setInscrito(true);
            } else {
                setAberto(false);
                toast.success("Pronto! Você vai receber as novidades em primeira mão.");
            }
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

                {inscrito ? (
                    <div className="px-7 py-9 text-center">
                        <h2
                            id="newsletter-titulo"
                            className="text-2xl font-semibold leading-snug text-gray-900"
                        >
                            {vip?.titulo || "Pronto! Agora entre no Grupo VIP"}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                            {vip?.descricao ||
                                "É no grupo do WhatsApp que as novidades e as promoções de atacado saem primeiro."}
                        </p>
                        <a
                            href={vip?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setAberto(false)}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1fb457]"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
                                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23z" />
                            </svg>
                            Entrar no Grupo VIP
                        </a>
                        <button
                            type="button"
                            onClick={() => setAberto(false)}
                            className="mt-3 text-xs text-gray-500 underline hover:text-gray-700"
                        >
                            Agora não, continuar comprando
                        </button>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
