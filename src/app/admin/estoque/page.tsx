"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, Plus, Save, RefreshCw, AlertTriangle, Search } from "lucide-react";

type Product = { id: string; name: string; category: string };
type Sku = { id?: string; product_id: string; size: string; color: string | null; stock_qty: number; reserved_qty: number };

const SIZES = ["PP", "P", "M", "G", "GG", "XG"];

function StockBadge({ qty, reserved }: { qty: number; reserved: number }) {
  const avail = Math.max(0, qty - reserved);
  if (avail === 0) return <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Esgotado</span>;
  if (avail <= 3) return <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Baixo ({avail})</span>;
  return <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">{avail} disp.</span>;
}

export default function AdminEstoquePage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.from("products").select("id, name, category").eq("active", true).order("name").limit(200)
      .then(({ data }) => setProducts(data || []));
  }, []);

  const loadSkus = async (productId: string) => {
    const { data } = await supabase
      .from("product_skus")
      .select("*")
      .eq("product_id", productId)
      .order("size");
    setSkus(data || []);
  };

  const selectProduct = async (p: Product) => {
    setSelected(p);
    await loadSkus(p.id);
  };

  const getOrCreate = (size: string) => {
    const existing = skus.find((s) => s.size === size && !s.color);
    if (existing) return existing;
    return { product_id: selected!.id, size, color: null, stock_qty: 0, reserved_qty: 0 };
  };

  const updateQty = (size: string, value: number) => {
    setSkus((prev) => {
      const idx = prev.findIndex((s) => s.size === size && !s.color);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], stock_qty: Math.max(0, value) };
        return updated;
      }
      return [...prev, { product_id: selected!.id, size, color: null, stock_qty: Math.max(0, value), reserved_qty: 0 }];
    });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);

    for (const sku of skus) {
      if (sku.id) {
        await supabase.from("product_skus").update({ stock_qty: sku.stock_qty }).eq("id", sku.id);
      } else if (sku.stock_qty > 0) {
        await supabase.from("product_skus").insert({
          product_id: selected.id,
          size: sku.size,
          color: sku.color,
          stock_qty: sku.stock_qty,
          reserved_qty: 0,
        });
      }
    }

    // Reload
    await loadSkus(selected.id);
    setSaving(false);
    setToast("Estoque salvo!");
    setTimeout(() => setToast(""), 2500);
  };

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAvail = skus.reduce((s, k) => s + Math.max(0, k.stock_qty - k.reserved_qty), 0);
  const lowStock = skus.filter((k) => Math.max(0, k.stock_qty - k.reserved_qty) <= 3 && Math.max(0, k.stock_qty - k.reserved_qty) > 0);
  const outOfStock = skus.filter((k) => k.stock_qty - k.reserved_qty <= 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Estoque em Tempo Real</h1>
        <p className="text-gray-500 mt-1">Grade SKU por tamanho/cor com reservas automáticas</p>
      </div>

      <div className="flex gap-6">
        {/* Product list */}
        <div className="w-72 shrink-0">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]" />
          </div>
          <div className="bg-white rounded-xl border overflow-hidden max-h-[600px] overflow-y-auto">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => selectProduct(p)}
                className={`w-full text-left px-4 py-3 text-sm border-b last:border-0 hover:bg-gray-50 transition-colors ${selected?.id === p.id ? "bg-[#FAF6F2]" : ""}`}>
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Stock editor */}
        <div className="flex-1">
          {!selected ? (
            <div className="bg-white rounded-xl border h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Package size={40} className="mx-auto mb-2 text-gray-200" />
                <p>Selecione um produto para editar o estoque</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{selected.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  {toast && <span className="text-xs text-green-600 font-medium">{toast}</span>}
                  <button onClick={() => loadSkus(selected.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <RefreshCw size={15} />
                  </button>
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-1.5 bg-[#8C2F39] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#7a2832] disabled:opacity-50">
                    <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>

              {/* Summary badges */}
              <div className="flex gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
                  <p className="text-xl font-bold text-green-600">{totalAvail}</p>
                  <p className="text-xs text-gray-500">Disponíveis</p>
                </div>
                {lowStock.length > 0 && (
                  <div className="bg-amber-50 rounded-lg px-4 py-3 text-center">
                    <p className="text-xl font-bold text-amber-600">{lowStock.length}</p>
                    <p className="text-xs text-gray-500">Tamanhos baixos</p>
                  </div>
                )}
                {outOfStock.length > 0 && (
                  <div className="bg-red-50 rounded-lg px-4 py-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-500" />
                    <div>
                      <p className="text-sm font-bold text-red-600">{outOfStock.length} esgotado{outOfStock.length !== 1 ? "s" : ""}</p>
                      <p className="text-xs text-gray-500">{outOfStock.map((s) => s.size).join(", ")}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Size grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-3 font-medium text-gray-600">Tamanho</th>
                      <th className="text-center pb-3 font-medium text-gray-600">Estoque total</th>
                      <th className="text-center pb-3 font-medium text-gray-600">Reservado</th>
                      <th className="text-center pb-3 font-medium text-gray-600">Disponível</th>
                      <th className="text-center pb-3 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {SIZES.map((size) => {
                      const sku = getOrCreate(size);
                      return (
                        <tr key={size} className="hover:bg-gray-50">
                          <td className="py-3 font-semibold">{size}</td>
                          <td className="py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={sku.stock_qty}
                              onChange={(e) => updateQty(size, parseInt(e.target.value) || 0)}
                              className="w-20 text-center border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
                            />
                          </td>
                          <td className="py-3 text-center text-gray-500">{sku.reserved_qty}</td>
                          <td className="py-3 text-center font-medium">
                            {Math.max(0, sku.stock_qty - sku.reserved_qty)}
                          </td>
                          <td className="py-3 text-center">
                            <StockBadge qty={sku.stock_qty} reserved={sku.reserved_qty} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
