"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    addItem,
    cartCount,
    cartSubTotal,
    removeAt,
    removeSelected,
    selectedCount,
    selectedItems,
    selectedSubTotal,
    setAllSelected,
    setQuantityAt,
    toggleSelectedAt,
} from "../../utils/cart";
import * as cartService from "../../services/cartService";
import { useAuth } from "../../hooks/count/useAuth";
import type { CartItem, CartValue } from "../../types/cart/cart";

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { customer, loading: authLoading } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!customer) {
            setItems(cartService.readCart());
            setReady(true);

            const onCartUpdate = () => setItems(cartService.readCart());
            window.addEventListener("cartUpdated", onCartUpdate);
            window.addEventListener("storage", onCartUpdate);

            return () => {
                window.removeEventListener("cartUpdated", onCartUpdate);
                window.removeEventListener("storage", onCartUpdate);
            };
        }

        let cancelled = false;

        (async () => {
            const pending = cartService.readCart();
            const serverItems =
                pending.length > 0
                    ? await cartService.mergeServerCart(pending)
                    : await cartService.fetchServerCart();

            if (cancelled) return;
            if (pending.length > 0) cartService.clearCart();

            setItems(serverItems);
            setReady(true);
        })().catch(() => {
            if (!cancelled) {
                setItems([]);
                setReady(true);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [customer, authLoading]);

    const persist = (next: CartItem[]) => {
        setItems(next);
        if (customer) cartService.saveServerCart(next);
        else cartService.writeCart(next);
    };

    const value: CartValue = {
        items,
        ready,
        count: cartCount(items),
        subtotal: cartSubTotal(items),
        add: (item) => persist(addItem(items, item)),
        remove: (index) => persist(removeAt(items, index)),
        setQuantity: (index, quantity) => persist(setQuantityAt(items, index, quantity)),
        clear: () => persist([]),
        toggleSelected: (index) => persist(toggleSelectedAt(items, index)),
        setAllSelected: (selected) => persist(setAllSelected(items, selected)),
        selectedItems: selectedItems(items),
        selectedCount: selectedCount(items),
        selectedSubtotal: selectedSubTotal(items),
        removeSelected: () => persist(removeSelected(items)),
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
    return ctx;
}
