"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { useCart } from "@/src/hooks/cart/useCart";
import { fetchProductStock } from "@/src/services/productsService";
import { buildCartItem, normalizeColorKey } from "@/src/utils/product";
import { sortSizes } from "@/src/utils/sizes";
import type { SkuStock, StoreProduct } from "@/src/types/product/products";

// Muitos produtos têm 100+ estampas (113/105 cores) — renderizar tudo como bolinha
// trava o celular. A partir deste limite viramos busca + 8 chips iniciais.
const MANY_COLORS = 16;
const COLLAPSED_COLORS = 8;

type Added = { id: number; label: string };

// Compra rápida DENTRO do card (não navega). Público: revendedora 35-55, dedo grande,
// sem letramento digital — alvos grandes, quantidade só com + / − (nunca digitar número).
export function QuickBuyPanel({
    product,
    onClose,
}: {
    product: StoreProduct;
    onClose: () => void;
}) {
    const cart = useCart();
    const panelRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(false);
    const [skus, setSkus] = useState<SkuStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [color, setColor] = useState(product.colors[0] ?? "");
    const [size, setSize] = useState("");
    const [qty, setQty] = useState(1);
    const [query, setQuery] = useState("");
    const [added, setAdded] = useState<Added[]>([]);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Disponibilidade por SKU (cor×tamanho×qtd) não vem na grade — busca sob demanda ao abrir.
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchProductStock(product.slug ?? product.id)
            .then((s) => {
                if (!cancelled) setSkus(s);
            })
            .catch(() => {
                if (!cancelled) setSkus([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [product.id, product.slug]);

    // Bottom-sheet no mobile: trava o scroll do body.
    useEffect(() => {
        if (!isMobile) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isMobile]);

    // Fecha ao clicar fora (o card é um Link — o listener está no painel, não no card) e no ESC.
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    const colorMatches = (skuColor: string | null | undefined, c: string) =>
        !c || !skuColor || skuColor.toLowerCase() === c.toLowerCase();

    // MESMA regra do SizeSelector: procura o sku por size+color; sem SKU pro par = riscado.
    const isSizeAvailable = (s: string): boolean => {
        if (skus.length === 0) return true;
        const sku = skus.find((k) => k.size === s && colorMatches(k.color, color));
        return Boolean(sku && sku.availableQty > 0);
    };

    // Cores com AO MENOS uma variação disponível (cor toda zerada some). Fallback: todas.
    const availableColors =
        skus.length === 0
            ? product.colors
            : product.colors.filter((c) =>
                  skus.some((s) => s.availableQty > 0 && colorMatches(s.color, c)),
              );

    // Tamanhos da cor selecionada: SOME quem tem SKU zerado; mantém disponíveis
    // (clicáveis) e os sem SKU pra essa cor (riscados via isSizeAvailable).
    const visibleSizes =
        skus.length === 0
            ? product.sizes
            : product.sizes.filter((sz) => {
                  const sku = skus.find(
                      (s) => s.size === sz && colorMatches(s.color, color),
                  );
                  return !(sku && sku.availableQty <= 0);
              });
    const orderedSizes = sortSizes(visibleSizes);

    // Se a cor selecionada zerou por completo, pula pra primeira cor disponível.
    useEffect(() => {
        if (skus.length === 0) return;
        if (availableColors.length > 0 && !availableColors.includes(color)) {
            setColor(availableColors[0]);
            setSize("");
        }
    }, [skus, availableColors, color]);

    const manyColors = availableColors.length >= MANY_COLORS;
    const shownColors = manyColors
        ? query.trim()
            ? availableColors.filter((c) =>
                  normalizeColorKey(c).includes(normalizeColorKey(query)),
              )
            : availableColors.slice(0, COLLAPSED_COLORS)
        : availableColors;

    const needColor = product.colors.length > 0;
    const canAdd = Boolean(size) && (!needColor || Boolean(color));

    const selectColor = (c: string) => {
        setColor(c);
        setSize(""); // tamanho pode não existir na nova cor — força reescolher.
    };

    const handleAdd = () => {
        if (!canAdd) return;
        cart.add(
            buildCartItem({
                product,
                selectedSize: size,
                selectedColor: color,
                quantity: qty,
            }),
        );
        const label = needColor ? `${qty}x ${size} · ${color}` : `${qty}x ${size}`;
        setAdded((a) => [...a, { id: Date.now(), label }]);
        // NÃO fecha: reseta a seleção e volta pronto pra próxima escolha.
        setSize("");
        setQty(1);
    };

    const chip = (label: string, selected: boolean, available: boolean) =>
        `min-h-[44px] min-w-[52px] rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            selected
                ? "border-[#8C2F39] bg-[#8C2F39] text-white"
                : available
                  ? "border-gray-300 text-gray-800 hover:border-[#8C2F39]"
                  : "cursor-not-allowed border-gray-200 text-gray-300 line-through"
        }`;

    const body = (
        <div
            ref={panelRef}
            className={
                isMobile
                    ? "fixed inset-x-0 bottom-0 z-[60] max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
                    : "absolute inset-x-0 top-0 z-40 max-h-[520px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
            }
            onClick={(e) => {
                // Dentro do painel: nunca deixa o clique subir pro Link do card.
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            {/* Cabeçalho */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                    {product.name}
                </h3>
                <button
                    type="button"
                    aria-label="Fechar"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                >
                    <X size={22} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
                </div>
            ) : (
                <>
                    {/* Estampas / cores */}
                    {availableColors.length > 0 && (
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-800">
                                Estampa:{" "}
                                <span className="font-normal text-gray-600">{color}</span>
                            </label>

                            {manyColors && (
                                <input
                                    type="text"
                                    inputMode="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={`Buscar entre ${availableColors.length} estampas…`}
                                    className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#8C2F39] focus:outline-none"
                                />
                            )}

                            <div className="flex flex-wrap gap-2">
                                {shownColors.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => selectColor(c)}
                                        className={chip(c, color === c, true)}
                                    >
                                        {c}
                                    </button>
                                ))}
                                {manyColors && !query.trim() && (
                                    <span className="self-center text-xs text-gray-400">
                                        digite pra ver as outras
                                    </span>
                                )}
                                {manyColors && query.trim() && shownColors.length === 0 && (
                                    <span className="self-center text-xs text-gray-400">
                                        nenhuma estampa com “{query}”
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tamanhos */}
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-800">
                            Tamanho:{" "}
                            <span className="font-normal text-gray-600">{size}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {orderedSizes.map((s) => {
                                const available = isSizeAvailable(s);
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        disabled={!available}
                                        onClick={() => available && setSize(s)}
                                        className={chip(s, size === s, available)}
                                    >
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quantidade — só + / − (nunca campo de digitar) */}
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-800">
                            Quantidade
                        </label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                aria-label="Diminuir"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 text-gray-800 hover:bg-gray-100"
                            >
                                <Minus size={22} />
                            </button>
                            <span className="min-w-[2.5rem] text-center text-2xl font-semibold text-gray-900">
                                {qty}
                            </span>
                            <button
                                type="button"
                                aria-label="Aumentar"
                                onClick={() => setQty((q) => q + 1)}
                                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 text-gray-800 hover:bg-gray-100"
                            >
                                <Plus size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Já adicionados nesta sessão do painel */}
                    {added.length > 0 && (
                        <ul className="mb-4 space-y-1 rounded-lg bg-[#F3EEE9] p-3">
                            {added.map((a) => (
                                <li
                                    key={a.id}
                                    className="flex items-center gap-2 text-sm text-[#6b4a2f]"
                                >
                                    <Check size={16} className="shrink-0 text-green-600" />
                                    <span>{a.label} · adicionado</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Adicionar — grande; NÃO fecha o painel */}
                    <button
                        type="button"
                        disabled={!canAdd}
                        onClick={handleAdd}
                        className={`w-full rounded-full py-4 text-base font-semibold uppercase tracking-wide transition-colors ${
                            canAdd
                                ? "bg-[#8C2F39] text-white hover:bg-[#7a2832]"
                                : "cursor-not-allowed bg-gray-200 text-gray-400"
                        }`}
                    >
                        {added.length > 0 ? "Adicionar mais" : "Adicionar"}
                    </button>
                </>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-[55] bg-black/40" aria-modal="true" role="dialog">
                {body}
            </div>
        );
    }

    return body;
}
