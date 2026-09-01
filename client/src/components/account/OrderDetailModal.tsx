"use client";

import { fetchMyOrder } from "../../services/ordersService";
import type { AccountOrderDetail } from "../../types/account/account";
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
