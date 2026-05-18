"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  pixPrice: number;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartCtx>({
  items: [], count: 0, total: 0,
  addItem: () => {}, removeItem: () => {}, updateQty: () => {}, clearCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("feminnita_cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("feminnita_cart", JSON.stringify(newItems));
  };

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const key = `${item.productId}-${item.size}-${item.color}`;
      const existing = prev.find((i) => i.id === key);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) => i.id === key ? { ...i, qty: i.qty + item.qty } : i);
      } else {
        next = [...prev, { ...item, id: key }];
      }
      localStorage.setItem("feminnita_cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      localStorage.setItem("feminnita_cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) { removeItem(id); return; }
    setItems((prev) => {
      const next = prev.map((i) => i.id === id ? { ...i, qty } : i);
      localStorage.setItem("feminnita_cart", JSON.stringify(next));
      return next;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem("feminnita_cart");
  }, []);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
