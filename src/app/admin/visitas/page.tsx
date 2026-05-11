"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Eye, Package, TrendingUp, ArrowUpDown, Info } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  code: string | null;
  images: string[];
  view_count: number;
  sales_count: number;
  revenue: number;
};

type Period = "7d" | "30d" | "90d";
type SortKey = "view_count" | "sales_count";

const PERIOD_LABELS: Record<Period, string> = { "7d": "7 dias", "30d": "30 dias", "90d": "90 dias" };

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function VisitasPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("view_count");

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);

    const days = parseInt(period);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // Fetch products with view_count
    const { data: products } = await supabase
      .from("products")
      .select("id, name, code, images, view_count")
      .order("view_count", { ascending: false })
      .limit(20);

    if (!products || products.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    // Fetch order_items for these products in the period
    const productIds = products.map(p => p.id);
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, total_price, orders!inner(created_at)")
      .in("product_id", productIds)
      .gte("orders.created_at", sinceISO);

    // Aggregate sales by product
    const salesMap: Record<string, { count: number; revenue: number }> = {};
    (orderItems ?? []).forEach((item: any) => {
      if (!salesMap[item.product_id]) salesMap[item.product_id] = { count: 0, revenue: 0 };
      salesMap[item.product_id].count += item.quantity ?? 1;
      salesMap[item.product_id].revenue += item.total_price ?? 0;
    });

    const result: ProductRow[] = products.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      images: p.images ?? [],
      view_count: p.view_count ?? 0,
      sales_count: salesMap[p.id]?.count ?? 0,
      revenue: salesMap[p.id]?.revenue ?? 0,
    }));

    setRows(result);
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);

  const totalProducts = rows.length;
  const withViews = rows.filter(r => r.view_count > 0).length;
  const topProduct = rows.reduce((top, r) => r.view_count > (top?.view_count ?? -1) ? r : top, null as ProductRow | null);

  const hasAnyViews = rows.some(r => r.view_count > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitas a Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">Analise quais produtos recebem mais atenção</p>
        </div>

        {/* Period selector */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Produtos Monitorados", value: totalProducts, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Com Visitas Registradas", value: withViews, icon: Eye, color: "text-green-600", bg: "bg-green-50" },
          {
            label: "Mais Visitado",
            value: topProduct?.name ?? "—",
            sub: topProduct ? `${topProduct.view_count.toLocaleString()} visitas` : undefined,
            icon: TrendingUp, color: "text-[#8C2F39]", bg: "bg-red-50",
          },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className={`${k.bg} p-3 rounded-lg flex-shrink-0`}>
              <k.icon size={20} className={k.color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-base font-bold text-gray-900 truncate">{k.value}</p>
              {k.sub && <p className="text-xs text-gray-400">{k.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
        <span>
          Visitas são registradas automaticamente quando um cliente acessa a página do produto.
          Os contadores são incrementados em tempo real a cada visualização.
        </span>
      </div>

      {/* Empty state */}
      {!loading && !hasAnyViews && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center space-y-2">
          <Eye size={36} className="mx-auto text-gray-300" />
          <p className="font-medium text-gray-500">Ainda sem dados de visita</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Os contadores são incrementados automaticamente quando clientes visitam a página do produto.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && hasAnyViews && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">Top 20 Produtos</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Ordenar por:</span>
              <button
                onClick={() => setSortKey(s => s === "view_count" ? "sales_count" : "view_count")}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                <ArrowUpDown size={12} />
                {sortKey === "view_count" ? "Visitas" : "Vendas"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["#", "Produto", "Código", "Visitas", "Vendas", "Receita"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs w-10">
                      {i + 1 === 1 ? (
                        <span className="text-yellow-500 font-bold">1</span>
                      ) : i + 1 === 2 ? (
                        <span className="text-gray-400 font-bold">2</span>
                      ) : i + 1 === 3 ? (
                        <span className="text-orange-400 font-bold">3</span>
                      ) : i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {row.images[0] ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={row.images[0]}
                              alt={row.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-gray-300" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 line-clamp-2">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.code && <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{row.code}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Eye size={13} className="text-gray-400" />
                        <span className={`font-semibold ${row.view_count > 0 ? "text-gray-900" : "text-gray-300"}`}>
                          {row.view_count.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.sales_count.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-400 py-12 text-sm">Carregando...</div>
      )}
    </div>
  );
}
