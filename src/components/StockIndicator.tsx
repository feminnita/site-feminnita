"use client";

import { useEffect, useState } from "react";

type SkuStock = {
  size: string;
  color: string | null;
  available_qty: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
};

type Props = {
  productId: string;
  selectedSize: string;
  selectedColor?: string;
};

export function StockIndicator({ productId, selectedSize, selectedColor }: Props) {
  const [skus, setSkus] = useState<SkuStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${productId}/stock`)
      .then((r) => r.json())
      .then((data) => { setSkus(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading || skus.length === 0) return null;

  // Find stock for currently selected variant
  const current = skus.find((s) => {
    const sizeMatch = s.size === selectedSize;
    const colorMatch = !selectedColor || !s.color || s.color.toLowerCase() === selectedColor.toLowerCase();
    return sizeMatch && colorMatch;
  });

  if (!current && !selectedSize) return null;

  if (current) {
    if (current.stock_status === "out_of_stock") {
      return (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-red-600 font-medium">Esgotado neste tamanho</span>
        </div>
      );
    }
    if (current.stock_status === "low_stock") {
      return (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-amber-600 font-medium">
            Últimas {current.available_qty} unidade{current.available_qty !== 1 ? "s" : ""}!
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-green-600">Em estoque</span>
      </div>
    );
  }

  return null;
}

// Size button variant — shows dot indicator per size
export function SizeStockDot({ status }: { status: "in_stock" | "low_stock" | "out_of_stock" | undefined }) {
  if (!status || status === "in_stock") return null;
  if (status === "out_of_stock") return <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />;
  return <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 border border-white animate-pulse" />;
}

// Hook for consuming stock data per product
export function useProductStock(productId: string) {
  const [skus, setSkus] = useState<SkuStock[]>([]);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products/${productId}/stock`)
      .then((r) => r.json())
      .then((data) => setSkus(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [productId]);

  const getStatus = (size: string, color?: string): SkuStock["stock_status"] | undefined => {
    const sku = skus.find((s) => s.size === size && (!color || !s.color || s.color.toLowerCase() === color.toLowerCase()));
    return sku?.stock_status;
  };

  return { skus, getStatus };
}
