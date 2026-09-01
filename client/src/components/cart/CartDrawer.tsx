"use client";

import { ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "../../hooks/cart/useCart";
import { useStoreMinOrder } from "../../hooks/cart/useStoreMinOrder";
import type { CartItem } from "../../types/cart/cart";
import { CompleteOrderStrip } from "./CompleteOrderStrip";
import { MinimumProgress } from "./MinimumProgress";

const brl = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

export function CartDrawer() {
    const router = useRouter();
    const { items, remove, setQuantity, subtotal, drawerOpen, closeDrawer } = useCart();
    const { minOrder } = useStoreMinOrder();

    // Bloqueia o avanço só quando o pedido mínimo está ativo e o subtotal não o atinge.
    const belowMinimum = minOrder.ativo && subtotal < minOrder.valor;

    useEffect(() => {
        if (!drawerOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDrawer();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [drawerOpen, closeDrawer]);

    const excludeIds = [...new Set(items.map((i) => i.id))];

    const goToCheckout = () => {
        closeDrawer();
        router.push("/checkout");
    };

    return (
        <>
            {/* Overlay */}
            <div
                onClick={closeDrawer}
                className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                aria-hidden={!drawerOpen}
            />

            {/* Panel */}
            <aside
                className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-gray-50 shadow-xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                role="dialog"
                aria-label="Carrinho"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b bg-white px-4 py-4">
                    <h2 className="text-lg font-medium">Seu carrinho</h2>
                    <button
                        type="button"
                        onClick={closeDrawer}
                        className="-m-2 p-2 text-gray-500 hover:text-gray-900"
                        aria-label="Fechar carrinho"
                    >
                        <X size={22} />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                        <ShoppingBag size={48} className="text-gray-300" />
                        <p className="text-gray-600">Seu carrinho está vazio</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 space-y-4 overflow-y-auto p-4">
                            <MinimumProgress subtotal={subtotal} />

                            <div className="space-y-3">
                                {items.map((item: CartItem, index: number) => (
                                    <div
                                        key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${index}`}
                                        className="flex gap-3 rounded-lg border bg-white p-3"
                                    >
                                        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                                            <Image
                                                src={item.images?.[0] || "/placeholder.png"}
                                                alt={item.name}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-medium">{item.name}</h3>
                                                <p className="text-xs text-gray-600">
                                                    Cor: {item.selectedColor}
                                                    {item.selectedSize ? ` · Tam: ${item.selectedSize}` : ""}
                                                </p>
                                                <p className="text-sm font-semibold">{brl(item.price)}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantity(index, item.quantity - 1)}
                                                        className="h-7 w-7 rounded border hover:bg-gray-100"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantity(index, item.quantity + 1)}
                                                        className="h-7 w-7 rounded border hover:bg-gray-100"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="text-gray-400 hover:text-red-500"
                                                    aria-label={`Remover ${item.name}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <CompleteOrderStrip excludeIds={excludeIds} />
                        </div>

                        <div className="space-y-3 border-t bg-white p-4">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span className="font-semibold">{brl(subtotal)}</span>
                            </div>
                            <p className="text-xs text-gray-500">Frete calculado no checkout</p>
                            <button
                                type="button"
                                onClick={goToCheckout}
                                disabled={belowMinimum}
                                className={`w-full rounded-lg py-3 text-white ${belowMinimum
                                    ? "cursor-not-allowed bg-gray-300"
                                    : "bg-black hover:bg-gray-800"
                                    }`}
                            >
                                Ir para pagamento
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </>
    );
}
