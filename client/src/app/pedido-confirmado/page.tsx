"use client";

import { Header } from "@/src/components/layout/Header";
import { MAX_PARCELAS } from "@/src/lib/parcelamento";
import { apiGet } from "@/src/services/api";
import { changePaymentMethod } from "@/src/services/checkoutService";
import type { OrderPaymentResult } from "@/src/types/checkout/checkout";
import {
    Barcode,
    CheckCircle,
    Copy,
    ExternalLink,
    Package,
    QrCode,
    Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "feminnita:lastOrder";
const POLL_START_MS = 3000;
const POLL_MAX_INTERVAL_MS = 30000;
const POLL_MAX_MS = 30 * 60 * 1000;

function OrderConfirmedContent() {
    const [order, setOrder] = useState<OrderPaymentResult | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [paid, setPaid] = useState(false);
    const [copied, setCopied] = useState(false);
    const firedRef = useRef(false);

    // sessionStorage só existe no navegador — lê depois de montar
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as OrderPaymentResult;
                setOrder(parsed);
                if (parsed.method === "card") setPaid(true);
            }
        } catch {
            // sessionStorage corrompido — cai no fallback
        }
        setLoaded(true);
    }, []);

    // Polling do status do pagamento com backoff exponencial (3s->30s), teto de
    // tempo, e pausa quando a aba não está visível. Antes: 5s fixo, sem parada
    // -> ~720 req/cliente numa janela de PIX. (Ideal futuro: o webhook do Asaas
    // empurra o estado via push, em vez do cliente puxar.)
    useEffect(() => {
        if (!order || paid || order.method === "card") return;

        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let delay = POLL_START_MS;
        const startedAt = Date.now();

        const schedule = (ms: number) => {
            timer = setTimeout(tick, ms);
        };

        const tick = async () => {
            if (stopped) return;
            if (Date.now() - startedAt > POLL_MAX_MS) return; // teto: para de puxar
            if (document.visibilityState === "hidden") return; // pausa; retoma no visible

            const data = await apiGet<{ paymentStatus?: string }>(
                `/api/store/orders/${order.orderId}`,
            );
            if (stopped) return;
            if (data?.paymentStatus === "paid") {
                setPaid(true);
                return;
            }
            delay = Math.min(delay * 1.5, POLL_MAX_INTERVAL_MS);
            schedule(delay);
        };

        const onVisibility = () => {
            if (stopped || document.visibilityState !== "visible") return;
            if (Date.now() - startedAt > POLL_MAX_MS) return;
            clearTimeout(timer);
            delay = POLL_START_MS; // volta a olhar rápido ao retomar
            schedule(500);
        };

        document.addEventListener("visibilitychange", onVisibility);
        schedule(delay);

        return () => {
            stopped = true;
            clearTimeout(timer);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [order, paid]);

    // Marcador interno de pagamento confirmado — SÓ quando pago de fato, 1x.
    // A conversão de venda (Meta/GA4/TikTok) é reportada server-side; aqui não
    // dispara nada em pedido não pago nem re-dispara ao reabrir a aba.
    useEffect(() => {
        if (!paid || !order || firedRef.current) return;
        firedRef.current = true;
        if ((window as any).gtag) {
            (window as any).gtag("event", "purchase_confirmed", {
                order_id: order.orderId,
            });
        }
    }, [paid, order]);

    // Troca de forma de pagamento. O pedido continua o mesmo; o que muda e o
    // total (PIX tem 5%) e a cobranca, que e refeita do lado do servidor.
    const [trocando, setTrocando] = useState<"pix" | "boleto" | "card" | null>(null);

    // Quantas vezes, quando a escolha for cartao. A loja anuncia "3x sem juros"
    // na faixa do topo; se a troca cria a cobranca em 1x, a promessa morre
    // justamente na hora de pagar.
    const [parcelas, setParcelas] = useState(1);

    const trocarForma = async (forma: "pix" | "boleto" | "card") => {
        if (!order || trocando) return;
        setTrocando(forma);
        try {
            const novo = await changePaymentMethod(
                order.orderId,
                forma,
                forma === "card" ? parcelas : 1,
            );
            const atualizado = {
                ...order,
                method: novo.method,
                total: novo.total,
                invoiceUrl: novo.invoiceUrl,
                bankSlipUrl: novo.bankSlipUrl,
                pixQrCode: novo.pixQrCode,
                pixCopyPaste: novo.pixCopyPaste,
            };
            setOrder(atualizado);
            // Guarda tambem no sessionStorage: recarregar a pagina nao pode
            // trazer de volta a cobranca que acabou de ser cancelada.
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
            } catch {
                /* storage bloqueado: a tela ja esta certa, so nao lembra */
            }
        } catch {
            alert("Não foi possível trocar a forma de pagamento. Tente novamente.");
        } finally {
            setTrocando(null);
        }
    };

    const copyPix = () => {
        if (!order?.pixCopyPaste) return;
        navigator.clipboard.writeText(order.pixCopyPaste);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    if (!loaded) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-24 text-center">
                    <p className="text-gray-500">Pedido não encontrado.</p>
                    <Link
                        href="/minha-conta"
                        className="mt-4 inline-block text-[#8C2F39] underline"
                    >
                        Ver meus pedidos
                    </Link>
                </div>
            </div>
        );
    }

    const { method } = order;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-12">
                <div className="mx-auto max-w-2xl">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle size={44} className="text-green-600" />
                        </div>
                        <h1 className="mb-2 text-3xl font-light">
                            {paid ? "Pagamento Confirmado!" : "Pedido Recebido!"}
                        </h1>
                        <p className="text-gray-500">
                            Número do pedido:{" "}
                            <strong className="text-gray-800">{order.orderNumber}</strong>
                        </p>
                    </div>

                    {/* Pagamento confirmado (webhook chegou) */}
                    {paid && method !== "card" && (
                        <div className="mb-6 rounded-xl border-2 border-green-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-green-100 p-2">
                                    <CheckCircle size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-green-800">
                                        Pagamento confirmado! 🎉
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Recebemos seu pagamento — já estamos preparando o envio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PIX payment */}
                    {method === "pix" && !paid && (
                        <div className="mb-6 rounded-xl border-2 border-blue-200 bg-white p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <QrCode size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Pague agora com PIX</h3>
                                    <p className="text-sm text-gray-500">
                                        Esta página atualiza sozinha assim que o pagamento cair
                                    </p>
                                </div>
                            </div>

                            {order.pixQrCode && (
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src={`data:image/png;base64,${order.pixQrCode}`}
                                        alt="QR Code PIX"
                                        className="h-48 w-48 rounded-lg border"
                                    />
                                </div>
                            )}

                            {order.pixCopyPaste && (
                                <>
                                    <p className="mb-2 text-xs text-gray-500">
                                        Ou copie o código PIX:
                                    </p>
                                    <div className="mb-3 select-all break-all rounded-lg border bg-gray-50 p-3 font-mono text-xs">
                                        {order.pixCopyPaste}
                                    </div>
                                    <button
                                        onClick={copyPix}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                                    >
                                        <Copy size={16} />
                                        {copied ? "Copiado!" : "Copiar código PIX"}
                                    </button>
                                </>
                            )}

                            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                                ⏱️ O código PIX expira em <strong>1 hora</strong>. Após o
                                pagamento você receberá um e-mail de confirmação.
                            </div>
                        </div>
                    )}

                    {/* Trocar de forma de pagamento DE VERDADE: o servidor
                        recalcula o total, cancela a cobrança antiga e emite
                        outra. Antes havia só um link para a fatura do Asaas, e
                        lá o valor já estava fechado no total do boleto — quem
                        trocava para PIX perdia os 5% sem ser avisado. */}
                    {!paid && (
                        <div className="mb-6 rounded-xl border bg-white p-4">
                            <p className="mb-3 text-center text-sm text-gray-600">
                                Prefere pagar de outra forma?
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                                {(
                                    [
                                        { id: "pix", rotulo: "PIX", nota: "5% de desconto" },
                                        { id: "boleto", rotulo: "Boleto", nota: "vence em 3 dias" },
                                        { id: "card", rotulo: "Cartão", nota: `até ${MAX_PARCELAS}x sem juros` },
                                    ] as const
                                )
                                    .filter((forma) => forma.id !== method)
                                    .map((forma) =>
                                        forma.id === "card" ? (
                                            <div
                                                key="card"
                                                className="flex flex-col items-center gap-1 rounded-lg border border-[#8C2F39] px-4 py-2"
                                            >
                                                <select
                                                    id="parcelas-troca"
                                                    value={parcelas}
                                                    onChange={(e) => setParcelas(Number(e.target.value))}
                                                    className="rounded border border-gray-200 px-2 py-1 text-xs"
                                                >
                                                    {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
                                                        <option key={n} value={n}>{n}x sem juros</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    disabled={trocando !== null}
                                                    onClick={() => trocarForma("card")}
                                                    className="text-sm font-medium text-[#8C2F39] disabled:opacity-50"
                                                >
                                                    {trocando === "card" ? "Trocando..." : "Pagar com Cartão"}
                                                </button>
                                            </div>
                                        ) : (
                                        <button
                                            key={forma.id}
                                            type="button"
                                            disabled={trocando !== null}
                                            onClick={() => trocarForma(forma.id)}
                                            className="flex flex-col items-center rounded-lg border border-[#8C2F39] px-4 py-2 text-sm font-medium text-[#8C2F39] transition-colors hover:bg-rose-50 disabled:opacity-50"
                                        >
                                            <span>
                                                {trocando === forma.id
                                                    ? "Trocando..."
                                                    : `Pagar com ${forma.rotulo}`}
                                            </span>
                                            <span className="text-xs font-normal text-gray-500">
                                                {forma.nota}
                                            </span>
                                        </button>
                                        ),
                                    )}
                            </div>
                            <p className="mt-3 text-center text-xs text-gray-400">
                                O valor é recalculado e a cobrança anterior é cancelada.
                            </p>
                        </div>
                    )}

                    {/* Boleto */}
                    {method === "boleto" && !paid && (
                        <div className="mb-6 rounded-xl border-2 border-yellow-200 bg-white p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-lg bg-yellow-100 p-2">
                                    <Barcode size={24} className="text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Boleto Bancário gerado</h3>
                                    <p className="text-sm text-gray-500">
                                        Pague até o vencimento para confirmar o pedido
                                    </p>
                                </div>
                            </div>

                            {order.bankSlipUrl ? (
                                <a
                                    href={order.bankSlipUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500 py-3 font-medium text-white transition-colors hover:bg-yellow-600"
                                >
                                    <ExternalLink size={16} />
                                    Abrir / Imprimir Boleto
                                </a>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    O boleto foi enviado para o seu e-mail.
                                </p>
                            )}

                            <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                                ⏱️ O boleto vence em <strong>3 dias úteis</strong>.
                            </p>
                        </div>
                    )}

                    {/* Cartão aprovado */}
                    {method === "card" && (
                        <div className="mb-6 rounded-xl border-2 border-green-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-green-100 p-2">
                                    <CheckCircle size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-green-800">
                                        Pagamento aprovado!
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Seu pedido será processado e enviado em breve
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Steps */}
                    <div className="mb-6 rounded-xl border bg-white p-6">
                        <h3 className="mb-4 font-semibold">Próximas etapas</h3>
                        <ol className="space-y-3">
                            {[
                                {
                                    n: 1,
                                    text:
                                        paid || method === "card"
                                            ? "Pagamento confirmado"
                                            : "Realize o pagamento",
                                },
                                {
                                    n: 2,
                                    text: "Separamos e embalamos seu pedido",
                                },
                                {
                                    n: 3,
                                    text: "Enviamos com código de rastreamento por e-mail",
                                },
                            ].map(({ n, text }) => (
                                <li key={n} className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#8C2F39] text-sm font-bold text-white">
                                        {n}
                                    </span>
                                    <span className="text-sm text-gray-700">{text}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Link href="/" className="flex-1">
                            <button className="w-full rounded-lg border-2 border-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                Continuar comprando
                            </button>
                        </Link>
                        <Link href="/minha-conta" className="flex-1">
                            <button className="w-full rounded-lg bg-[#8C2F39] py-3 font-medium text-white transition-colors hover:bg-[#7a2832]">
                                Ver meus pedidos
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderConfirmedPage() {
    return <OrderConfirmedContent />;
}
