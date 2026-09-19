"use client";

import { fetchMyOrder } from "../../services/ordersService";
import type { AccountOrderDetail } from "../../types/account/account";
import {
    changePaymentMethod,
    fetchPaymentInfo,
    type InfoDePagamento,
} from "../../services/checkoutService";

type FormaDePagamento = "pix" | "boleto" | "card";

const ROTULO_DA_FORMA: Record<string, string> = {
    pix: "PIX",
    boleto: "Boleto",
    card: "Cartão",
};

// A regra de cada forma fica ao lado do botao: trocar para PIX sem saber que
// ha 5% e decidir no escuro.
const FORMAS_DE_PAGAMENTO: { id: FormaDePagamento; rotulo: string; nota: string }[] = [
    { id: "pix", rotulo: "PIX", nota: "5% de desconto" },
    { id: "boleto", rotulo: "Boleto", nota: "vence em 3 dias" },
    { id: "card", rotulo: "Cartão", nota: "até 3x sem juros" },
];
import {
    CreditCard,
    ExternalLink,
    Loader2,
    MapPin,
    Package,
    Truck,
    X,
} from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useEffect, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
    pending: "Aguardando pagamento",
    confirmed: "Confirmado",
    paid: "Pago",
    processing: "Processando",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: "Aguardando",
    paid: "Pago",
    failed: "Falhou",
    overdue: "Vencido",
    refunded: "Reembolsado",
    disputed: "Em disputa",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    pix: "PIX",
    boleto: "Boleto bancário",
    card: "Cartão de crédito",
};

function money(value: number): string {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function OrderDetailModal({
    orderId,
    onClose,
}: {
    orderId: string;
    onClose: () => void;
}) {
    const [order, setOrder] = useState<AccountOrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        fetchMyOrder(orderId)
            .then((data) => {
                if (!cancelled) setOrder(data);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [orderId]);

    // PAGAMENTO de pedido ainda nao pago.
    //
    // Esta tela so contava o que ja tinha acontecido: itens, endereco, rastreio.
    // Quem fechava no boleto e fechava a aba nao tinha por onde pagar — e boleto
    // e exatamente o que se paga depois. O link vem do Asaas na hora, nunca do
    // banco: boleto vence, e cobranca trocada e cancelada. Link guardado
    // envelhece calado, e a cliente clica num boleto morto sem entender.
    const [pagamento, setPagamento] = useState<InfoDePagamento | null>(null);
    const [trocando, setTrocando] = useState<FormaDePagamento | null>(null);

    const aguardandoPagamento =
        !!order && order.paymentStatus !== "paid" && order.status !== "cancelled";

    useEffect(() => {
        if (!aguardandoPagamento) return;
        let cancelado = false;

        fetchPaymentInfo(orderId).then((info) => {
            if (!cancelado) setPagamento(info);
        });

        return () => {
            cancelado = true;
        };
    }, [orderId, aguardandoPagamento]);

    const trocarForma = async (forma: FormaDePagamento) => {
        if (trocando) return;
        setTrocando(forma);
        try {
            const novo = await changePaymentMethod(orderId, forma);
            setPagamento({
                paymentMethod: novo.method,
                total: String(novo.total),
                status: "PENDING",
                invoiceUrl: novo.invoiceUrl,
                bankSlipUrl: novo.bankSlipUrl,
                pixQrCode: novo.pixQrCode,
                pixCopyPaste: novo.pixCopyPaste,
            });
            setOrder((atual) =>
                atual ? { ...atual, total: novo.total, paymentMethod: novo.method } : atual,
            );
        } catch {
            alert("Não foi possível trocar a forma de pagamento. Tente novamente.");
        } finally {
            setTrocando(null);
        }
    };

    const addr = order?.shippingAddress;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-[#8C2F39]" />
                    </div>
                ) : !order ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">
                            Não foi possível carregar o pedido.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-4 rounded-lg border px-6 py-2 text-sm hover:bg-gray-50"
                        >
                            Fechar
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="sticky top-0 flex items-start justify-between border-b bg-white px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold">{order.orderNumber}</h2>
                                <p className="text-xs text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <OrderStatusBadge
                                            status={order.status}
                                            paymentStatus={order.paymentStatus}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            {/* Pagamento pendente: e o que a cliente veio fazer aqui */}
                            {aguardandoPagamento && pagamento && (
                                <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50/50 p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                        Pagamento pendente —{" "}
                                        {ROTULO_DA_FORMA[pagamento.paymentMethod ?? "pix"] ?? "PIX"}
                                    </h3>

                                    {pagamento.pixQrCode && (
                                        <div className="mb-3 text-center">
                                            <img
                                                src={"data:image/png;base64," + pagamento.pixQrCode}
                                                alt="QR Code do PIX"
                                                className="mx-auto h-44 w-44"
                                            />
                                            {pagamento.pixCopyPaste && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigator.clipboard.writeText(
                                                            String(pagamento.pixCopyPaste),
                                                        )
                                                    }
                                                    className="mt-2 text-xs text-[#8C2F39] underline"
                                                >
                                                    Copiar código PIX
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {pagamento.bankSlipUrl ? (
                                        <a
                                            href={pagamento.bankSlipUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block rounded-lg bg-[#8C2F39] px-4 py-2 text-sm font-semibold text-white"
                                        >
                                            Ver boleto
                                        </a>
                                    ) : (
                                        pagamento.invoiceUrl && (
                                            <a
                                                href={pagamento.invoiceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block rounded-lg bg-[#8C2F39] px-4 py-2 text-sm font-semibold text-white"
                                            >
                                                Pagar agora
                                            </a>
                                        )
                                    )}

                                    <p className="mb-2 mt-4 text-xs text-gray-600">
                                        Prefere pagar de outra forma?
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {FORMAS_DE_PAGAMENTO.filter(
                                            (f) => f.id !== (pagamento.paymentMethod ?? "pix"),
                                        ).map((forma) => (
                                            <button
                                                key={forma.id}
                                                type="button"
                                                disabled={trocando !== null}
                                                onClick={() => trocarForma(forma.id)}
                                                className="rounded-lg border border-[#8C2F39] px-3 py-1.5 text-xs font-medium text-[#8C2F39] hover:bg-rose-50 disabled:opacity-50"
                                            >
                                                {trocando === forma.id
                                                    ? "Trocando..."
                                                    : forma.rotulo + " — " + forma.nota}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-[11px] text-gray-400">
                                        O valor é recalculado e a cobrança anterior é cancelada.
                                    </p>
                                </div>
                            )}

                            {/* Itens */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Package size={15} /> Itens do pedido
                                </h3>
                                <div className="space-y-3">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                {item.productImage && (
                                                    <img
                                                        src={item.productImage}
                                                        alt={item.productName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {item.productName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {[item.color, item.size].filter(Boolean).join(" · ")}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {item.quantity}× {money(item.unitPrice)}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold">
                                                {money(item.totalPrice)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Entrega */}
                            <div className="rounded-xl bg-gray-50 p-4">
                                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <MapPin size={15} /> Entrega
                                </h3>
                                {addr && (
                                    <p className="text-sm text-gray-600">
                                        {addr.street}, {addr.number}
                                        {addr.complement ? ` — ${addr.complement}` : ""}
                                        <br />
                                        {addr.neighborhood} · {addr.city} — {addr.state}
                                        <br />
                                        CEP: {addr.cep}
                                    </p>
                                )}
                                {order.shippingMethod && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                                        <Truck size={14} /> {order.shippingMethod}
                                    </p>
                                )}
                                {order.trackingCode &&
                                    (order.trackingUrl ? (
                                        <a
                                            href={order.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#8C2F39] hover:underline"
                                        >
                                            Rastrear: {order.trackingCode}
                                            <ExternalLink size={13} />
                                        </a>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Rastreio: <strong>{order.trackingCode}</strong>
                                        </p>
                                    ))}
                            </div>

                            {/* Pagamento */}
                            <div className="rounded-xl bg-gray-50 p-4">
                                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <CreditCard size={15} /> Pagamento
                                </h3>
                                <p className="mb-3 text-sm text-gray-600">
                                    {PAYMENT_METHOD_LABELS[order.paymentMethod ?? ""] ??
                                        order.paymentMethod ??
                                        "—"}
                                    {order.paymentMethod === "card" &&
                                        order.installments &&
                                        order.installments > 1 &&
                                        ` — ${order.installments}×`}
                                </p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{money(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Frete</span>
                                        <span>
                                            {order.shippingCost === 0
                                                ? "Grátis"
                                                : money(order.shippingCost)}
                                        </span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>
                                                Desconto
                                                {order.couponCode ? ` (${order.couponCode})` : ""}
                                            </span>
                                            <span>- {money(order.discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t pt-2 font-bold">
                                        <span>Total</span>
                                        <span className="text-[#8C2F39]">{money(order.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
