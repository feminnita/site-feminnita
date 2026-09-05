"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../../hooks/cart/useCart";
import { MIN_ORDER, formatBRL } from "../../lib/minOrder";

// Páginas onde a barra global NÃO aparece: no carrinho o contador já é exibido
// na própria página (ver MinOrderStatus abaixo) e o checkout é o passo final.
const HIDDEN_PREFIXES = ["/carrinho", "/checkout"];

// Barra visível enquanto a revendedora navega a vitrine e some com carrinho vazio.
export function useMinOrderVisible(): boolean {
    const { count } = useCart();
    const pathname = usePathname();

    if (count <= 0) return false; // carrinho vazio => barra a R$0 é ruído
    if (
        pathname &&
        HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    ) {
        return false;
    }
    return true;
}

// Contador reutilizável (texto + barra de progresso). Sem botão — o botão de
// finalizar fica a cargo de quem usa (a MinOrderBar ou a própria página do carrinho).
export function MinOrderStatus({
    subtotal,
    className = "",
}: {
    subtotal: number;
    className?: string;
}) {
    const reached = subtotal >= MIN_ORDER;
    const remaining = Math.max(0, MIN_ORDER - subtotal);
    const pct = Math.min(100, Math.round((subtotal / MIN_ORDER) * 100));

    return (
        <div className={className}>
            {reached ? (
                <p className="text-sm leading-snug">
                    <span className="font-semibold text-green-700">
                        Pedido mínimo atingido
                    </span>
                    <span className="text-gray-500"> · {formatBRL(subtotal)}</span>
                </p>
            ) : (
                <p className="text-sm leading-snug text-gray-700">
                    <span className="font-medium">Seu pedido: {formatBRL(subtotal)}</span>
                    <span className="text-gray-600">
                        {" "}· faltam{" "}
                        <span className="font-semibold text-[#8C2F39]">
                            {formatBRL(remaining)}
                        </span>{" "}
                        para o mínimo de {formatBRL(MIN_ORDER)}
                    </span>
                </p>
            )}

            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${reached ? "bg-green-600" : "bg-[#8C2F39]"
                        }`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// Barra global: RODAPÉ fixo no celular, TOPO (abaixo do header) no desktop.
// No desktop usa position:sticky para reservar seu próprio espaço no fluxo; o
// Header ganha md:top-12 quando o carrinho tem itens para empilhar logo abaixo.
export function MinOrderBar() {
    const { subtotal } = useCart();
    const visible = useMinOrderVisible();

    if (!visible) return null;

    const reached = subtotal >= MIN_ORDER;

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)] md:sticky md:top-0 md:bottom-auto md:h-12 md:border-b md:border-t-0 md:shadow-sm">
            <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2.5 md:h-full md:py-0">
                <MinOrderStatus subtotal={subtotal} className="min-w-0 flex-1" />

                {reached && (
                    <Link
                        href="/carrinho"
                        className="shrink-0 rounded-lg bg-[#8C2F39] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7a2832] active:scale-95"
                    >
                        Finalizar pedido
                    </Link>
                )}
            </div>
        </div>
    );
}

// Espaçador só no celular: evita que a barra fixa no rodapé cubra o conteúdo
// final da página. No desktop a barra é sticky e reserva o próprio espaço.
export function MinOrderBottomSpacer() {
    const visible = useMinOrderVisible();
    if (!visible) return null;
    return <div aria-hidden className="h-20 md:hidden" />;
}
