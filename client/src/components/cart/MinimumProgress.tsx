"use client";

import { useStoreMinOrder } from "../../hooks/cart/useStoreMinOrder";

const brl = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

export function MinimumProgress({ subtotal }: { subtotal: number }) {
    const { minOrder } = useStoreMinOrder();

    // Pedido mínimo desligado no painel: a barra some.
    if (!minOrder.ativo) return null;

    const min = minOrder.valor;
    const reached = subtotal >= min;
    const remaining = Math.max(0, min - subtotal);
    const pct = Math.min(100, (subtotal / min) * 100);

    return (
        <div className="space-y-2 rounded-lg border bg-white p-4">
            <p className="text-sm font-medium">
                {reached ? (
                    <span className="text-green-700">Pedido mínimo atingido</span>
                ) : (
                    <span className="text-gray-700">
                        Faltam <span className="font-semibold text-[#8C2F39]">{brl(remaining)}</span> para o
                        pedido mínimo
                    </span>
                )}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${reached ? "bg-green-600" : "bg-[#8C2F39]"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-xs text-gray-500">Pedido mínimo de {brl(min)}</p>
        </div>
    );
}
