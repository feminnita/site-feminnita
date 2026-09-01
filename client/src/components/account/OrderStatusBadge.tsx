import {
    AlertCircle,
    CheckCircle,
    Clock,
    type LucideIcon,
    Package,
    Truck,
    XCircle,
} from "lucide-react";

type BadgeConfig = { label: string; color: string; icon: LucideIcon };

export function deriveOrderBadge(
    status: string,
    paymentStatus: string,
): BadgeConfig {
    if (status === "cancelled")
        return { label: "Cancelado", color: "text-red-600 bg-red-50", icon: XCircle };

    if (paymentStatus === "refunded")
        return { label: "Reembolsado", color: "text-gray-600 bg-gray-100", icon: XCircle };

    if (paymentStatus === "disputed")
        return { label: "Em disputa", color: "text-red-600 bg-red-50", icon: AlertCircle };

    if (status === "delivered")
        return { label: "Entregue", color: "text-purple-600 bg-purple-50", icon: CheckCircle };

    if (status === "shipped")
        return { label: "Enviado", color: "text-indigo-600 bg-indigo-50", icon: Truck };

    if (paymentStatus === "overdue")
        return { label: "Pagamento vencido", color: "text-amber-600 bg-amber-50", icon: Clock };

    if (paymentStatus === "paid")
        return { label: "Pago — em preparação", color: "text-green-600 bg-green-50", icon: Package };

    return { label: "Aguardando pagamento", color: "text-yellow-600 bg-yellow-50", icon: Clock };
}

export function OrderStatusBadge({
    status,
    paymentStatus,
}: {
    status: string;
    paymentStatus: string;
}) {
    const { label, color, icon: Icon } = deriveOrderBadge(status, paymentStatus);

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
        >
            <Icon size={11} />
            {label}
        </span>
    );
}
