"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from 'sonner';
import { useCart } from "../../hooks/cart/useCart";
import { fetchProductStock } from "../../services/productsService";
import { isSelected } from "../../utils/cart";
import { PIX_DISCOUNT_RATE } from "../../utils/pricing";
import { MinOrderStatus } from "../../components/common/MinOrderBar";
import type { CartItem } from "../../types/cart/cart";
import type { SkuStock } from "../../types/product/products";
import { AlertCircle, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
    const {
        items,
        add,
        remove,
        setQuantity,
        toggleSelected,
        setAllSelected,
        selectedCount,
        selectedSubtotal,
    } = useCart();

    const [stockMap, setStockMap] = useState<Record<string, SkuStock[]>>({});

    const productIds = useMemo(
        () => [...new Set(items.map((i: any) => i.id))].sort().join(","),
        [items],
    );

    useEffect(() => {
        if (!productIds) return;

        let cancelled = false;

        Promise.all(
            productIds.split(",").map(async (id) => {
                const skus = await fetchProductStock(id).catch(() => []);
                return [id, skus] as const;
            }),
        ).then((entries) => {
            if (!cancelled) setStockMap(Object.fromEntries(entries));
        });

        return () => {
            cancelled = true;
        };
    }, [productIds]);

    const availableFor = (item: CartItem): number | null => {
        const skus = stockMap[item.id];
        if (!skus) return null;

        const sku = skus.find((s) => {
            const sizeMatch = s.size === item.selectedSize;
            const colorMatch =
                !item.selectedColor ||
                !s.color ||
                s.color.toLowerCase() === item.selectedColor.toLowerCase();
            return sizeMatch && colorMatch;
        });

        return sku ? sku.availableQty : 0;
    };

    const stockIssue = (item: CartItem): string | null => {
        const available = availableFor(item);
        if (available === null) return null;
        if (available === 0) return "Esgotado — remova ou desmarque este item";
        if (item.quantity > available)
            return `Só ${available} disponíve${available > 1 ? "is" : "l"} — ajuste a quantidade`;
        return null;
    };

    const handleRemove = (index: number) => {
        const removed = items[index];
        remove(index);
        toast("Item removido do carrinho", {
            duration: 5000,
            action: {
                label: "Desfazer",
                onClick: () => add(removed),
            },
        });
    };

    const hasBlockingIssue = items.some(
        (item: any) => isSelected(item) && stockIssue(item) !== null,
    );

    const allSelected = items.length > 0 && items.every(isSelected);
    // Frete é cotado por CEP no checkout (Melhor Envio). No carrinho não há CEP,
    // então não inventamos valor — total mentiroso é pior que total ausente.
    const total = selectedSubtotal;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="border-b bg-white py-4">
                    <div className="container mx-auto px-4">
                        <Link href="/" className="text-xl font-light text-[#8C2F39]">
                            feminnita
                        </Link>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-16">
                    <div className="mx-auto max-w-2xl space-y-6 text-center">
                        <ShoppingBag size={64} className="mx-auto text-gray-300" />
                        <h1 className="text-3xl font-light">Seu carrinho está vazio</h1>
                        <Link
                            href="/"
                            className="inline-block rounded-lg bg-black px-8 py-3 text-white hover:bg-gray-800"
                        >
                            Continuar Comprando
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white py-4">
                <div className="container mx-auto px-4">
                    <Link href="/" className="text-xl font-light text-[#8C2F39]">
                        feminnita
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <h1 className="mb-8 text-3xl font-light">Carrinho de Compras</h1>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Cart Items */}
                    <div className="space-y-4 lg:col-span-2">
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => setAllSelected(e.target.checked)}
                                className="h-5 w-5 accent-[#8C2F39]"
                            />
                            <span className="text-sm font-medium">
                                Selecionar todos os itens
                            </span>
                        </label>

                        {items.map((item: CartItem, index: number) => {
                            const issue = stockIssue(item);

                            return (
                                <div
                                    key={`${item.id}-${item.selectedColor}-${index}`}
                                    className={`flex flex-col gap-4 rounded-lg border bg-white p-4 transition-opacity sm:flex-row ${isSelected(item) ? "" : "opacity-50"
                                        } ${issue && isSelected(item) ? "border-red-300" : ""}`}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(item)}
                                            onChange={() => toggleSelected(index)}
                                            className="h-5 w-5 accent-[#8C2F39]"
                                            aria-label={`Selecionar ${item.name}`}
                                        />
                                    </div>

                                    <div className="relative mx-auto h-32 w-24 flex-shrink-0 overflow-hidden rounded bg-gray-100 sm:mx-0">
                                        <Image
                                            src={item.images?.[0] || "/placeholder.png"}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            Cor: {item.selectedColor}
                                            {item.selectedSize ? ` · Tam: ${item.selectedSize}` : ""}
                                        </p>
                                        <p className="font-semibold">
                                            R$ {item.price.toFixed(2).replace(".", ",")}
                                        </p>
                                        {issue && (
                                            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                                                <AlertCircle size={13} />
                                                {issue}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-row items-center justify-between sm:flex-col sm:items-end sm:justify-between">
                                        <button
                                            onClick={() => handleRemove(index)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setQuantity(index, item.quantity - 1)}
                                                className="h-8 w-8 rounded border hover:bg-gray-100"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => setQuantity(index, item.quantity + 1)}
                                                className="h-8 w-8 rounded border hover:bg-gray-100"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="font-semibold">
                                            R${" "}
                                            {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-4 space-y-4 rounded-lg border bg-white p-6">
                            <h2 className="text-xl font-medium">Resumo do Pedido</h2>

                            {/* Mesmo contador de pedido mínimo (R$ 199) da barra da vitrine,
                                aqui sobre o valor SELECIONADO (o que vai pro checkout). */}
                            <MinOrderStatus subtotal={selectedSubtotal} />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>
                                        Subtotal ({selectedCount}{" "}
                                        {selectedCount === 1 ? "item" : "itens"})
                                    </span>
                                    <span>R$ {selectedSubtotal.toFixed(2).replace(".", ",")}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Frete</span>
                                    <span>Calculado no checkout</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total</span>
                                    <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">no PIX ({Math.round(PIX_DISCOUNT_RATE * 100)}% OFF)</p>
                            </div>

                            {selectedCount === 0 ? (
                                <button
                                    disabled
                                    className="w-full cursor-not-allowed rounded-lg bg-gray-300 py-3 text-white"
                                >
                                    Selecione ao menos um item
                                </button>
                            ) : hasBlockingIssue ? (
                                <button
                                    disabled
                                    className="w-full cursor-not-allowed rounded-lg bg-gray-300 py-3 text-white"
                                >
                                    Ajuste os itens sem estoque
                                </button>
                            ) : (
                                <Link href="/checkout">
                                    <button className="w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800">
                                        Finalizar Compra
                                    </button>
                                </Link>
                            )}

                            <Link href="/">
                                <button className="mt-3 w-full rounded-lg border py-3 hover:bg-gray-50">
                                    Continuar Comprando
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
