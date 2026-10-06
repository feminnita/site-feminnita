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

// O convite do Grupo VIP SAIU daqui em 06/10/2026. O pop-up abre 12s depois da
// cliente chegar e dizia "As promoções saem no grupo antes do site": mandava
// para o WhatsApp quem ainda estava escolhendo. Agora o pop-up so entrega o
// cupom, que puxa a compra no site; o convite foi para depois do pagamento
// (pagina de pedido confirmado e e-mail de pagamento) e para o rodape.

// A foto do pop-up também vem do site_settings (chave newsletter_popup), pelo
// mesmo motivo: trocar a imagem da campanha é decisão de quem vende, não de
// quem programa. Sem imagem configurada, o pop-up volta ao formato de coluna
// única — mais pobre, mas inteiro.
type PopupConfig = { imagem?: string; cupom?: string; cupomTexto?: string };

export function NewsletterPopup() {
    const [aberto, setAberto] = useState(false);
    const [email, setEmail] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [configCarregada, setConfigCarregada] = useState(false);
    const [popup, setPopup] = useState<PopupConfig>({});
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
        if (!aberto || configCarregada) return;
        fetchSettings()
            .then((s) => setPopup((s?.newsletter_popup as PopupConfig) || {}))
            .catch(() => {})
            .finally(() => setConfigCarregada(true));
    }, [aberto, configCarregada]);

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
            // Com cupom configurado, a tela seguinte entrega o codigo; sem
            // cupom, so um aviso e a cliente continua comprando.
            if (popup.cupom) {
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

    const temFoto = Boolean(popup.imagem);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-titulo"
            onClick={fechar}
        >
            <div
                className={`relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${
                    temFoto && !inscrito
                        ? "max-h-[92vh] max-w-3xl md:grid md:grid-cols-2"
                        : "max-w-md"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={fechar}
                    aria-label="Fechar"
                    /* z-20: a foto vem DEPOIS no código e, por ser posicionada,
                       pintava por cima do X — o clique ia para a imagem e o
                       pop-up não fechava. Quem quer sair tem que conseguir. */
                    className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-1.5 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                    <X size={18} />
                </button>

                {inscrito ? (
                    <div className="px-7 py-9 text-center">
                        <h2
                            id="newsletter-titulo"
                            className="text-2xl font-semibold leading-snug text-gray-900"
                        >
                            Pronto! Seu cupom está aqui 🎁
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                            Use na sua primeira compra aqui no site.
                        </p>

                        {/* O cupom prometido, entregue. Em destaque e selecionável:
                            a pessoa precisa copiar isto para usar no checkout. */}
                        {popup.cupom && (
                            <div className="mt-5 rounded-xl border border-dashed border-[#8C2F39]/40 bg-[#8C2F39]/5 px-4 py-3">
                                <p className="text-xs text-gray-600">
                                    {popup.cupomTexto || "Seu cupom"}
                                </p>
                                <p className="mt-1 select-all font-mono text-xl font-bold tracking-wider text-[#8C2F39]">
                                    {popup.cupom}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Use no carrinho, em &quot;Cupom de desconto&quot;.
                                </p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setAberto(false)}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8C2F39] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7a2832]"
                        >
                            Continuar comprando
                        </button>
                    </div>
                ) : (
                <>
                {/* A foto ocupa metade no computador e uma faixa no celular, onde
                    a tela é do formulário. Sem foto configurada, some e o texto
                    volta a ocupar tudo. */}
                {temFoto && (
                    <div className="relative h-44 w-full md:h-auto">
                        <img
                            src={popup.imagem}
                            alt=""
                            className="h-full w-full object-cover object-top md:absolute md:inset-0"
                        />
                    </div>
                )}

                <div className={temFoto ? "px-7 py-8 md:flex md:flex-col md:justify-center" : "px-7 py-9"}>
                    <h2
                        id="newsletter-titulo"
                        className="text-[26px] font-bold leading-[1.15] tracking-tight text-gray-900 md:text-[30px]"
                    >
                        Desconto na sua
                        <br />
                        primeira compra.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        Deixe seu e-mail e receba seu cupom agora.
                    </p>

                    {/* O cupom e o motivo concreto de deixar o e-mail. Aparece
                        como promessa aqui e vira codigo na tela seguinte. */}
                    {popup.cupomTexto && (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#8C2F39]/10 px-3 py-2 text-sm font-semibold text-[#8C2F39]">
                            🎁 {popup.cupomTexto}
                        </p>
                    )}

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
                </>
                )}
            </div>
        </div>
    );
}
