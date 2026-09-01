"use client";

import { Header } from "@/src/components/layout/Header";
import { apiGet } from "@/src/services/api";
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
import { useEffect, useState } from "react";

const STORAGE_KEY = "feminnita:lastOrder";
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_MS = 10 * 60 * 1000;

function OrderConfirmedContent() {
    const [order, setOrder] = useState<OrderPaymentResult | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [paid, setPaid] = useState(false);
    const [copied, setCopied] = useState(false);

    // sessionStorage só existe no navegador — lê depois de montar
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as OrderPaymentResult;
                setOrder(parsed);
                if (parsed.method === "card") setPaid(true);

                if ((window as any).gtag) {
                    (window as any).gtag("event", "purchase_confirmed", {
                        order_id: parsed.orderId,
                    });
                }
            }
        } catch {
            // sessionStorage corrompido — cai no fallback
        }
        setLoaded(true);
    }, []);

    // Polling: espera o webhook do Asaas confirmar o pagamento
    useEffect(() => {
        if (!order || paid || order.method === "card") return;

        const startedAt = Date.now();
        const interval = setInterval(async () => {
            if (Date.now() - startedAt > POLL_MAX_MS) {
                clearInterval(interval);
                return;
            }

            const data = await apiGet<{ paymentStatus?: string }>(
                `/api/store/orders/${order.orderId}`,
            );

            if (data?.paymentStatus === "paid") {
                setPaid(true);
                clearInterval(interval);
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [order, paid]);

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
                                ⏱️ Aprovação em até <strong>2 dias úteis</strong> após o
                                pagamento. O boleto vence em 3 dias.
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
