"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, ShoppingBag, Users, TrendingUp, TrendingDown, ArrowRight, Calendar } from "lucide-react";

type Period = "7" | "30" | "90";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function subDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

function isoDate(d: Date) {
  return d.toISOString();
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendente",    color: "bg-yellow-400" },
  confirmed:  { label: "Confirmado", color: "bg-blue-400" },
  paid:       { label: "Pago",       color: "bg-green-500" },
  processing: { label: "Processando",color: "bg-blue-400" },
  shipped:    { label: "Enviado",    color: "bg-indigo-400" },
  delivered:  { label: "Entregue",   color: "bg-purple-500" },
  cancelled:  { label: "Cancelado",  color: "bg-red-400" },
};

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("7");
  const [loading, setLoading] = useState(true);

  // Current period data
  const [revenue, setRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  // Previous period data
  const [prevRevenue, setPrevRevenue] = useState(0);
  const [prevOrders, setPrevOrders] = useState(0);
  const [prevCustomers, setPrevCustomers] = useState(0);

  // Chart: daily paid orders
  const [dailyData, setDailyData] = useState<{ label: string; value: number }[]>([]);

  // Status breakdown
  const [statusBreakdown, setStatusBreakdown] = useState<{ status: string; count: number }[]>([]);

  // Recent orders
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Product stats
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number; revenue: number }[]>([]);

  const supabase = createClient();

  useEffect(() => { load(); }, [period]);

  const load = async () => {
    setLoading(true);
    const days = parseInt(period);
    const now = new Date();
    const start = subDays(now, days);
    const prevStart = subDays(start, days);

    const [ordersRes, prevOrdersRes, customersRes, prevCustomersRes, itemsRes] = await Promise.all([
      supabase.from("orders").select("id, status, total, created_at, customer_name, order_number, payment_method")
        .gte("created_at", isoDate(start)).order("created_at", { ascending: false }),
      supabase.from("orders").select("id, status, total")
        .gte("created_at", isoDate(prevStart)).lt("created_at", isoDate(start)),
      supabase.from("orders").select("customer_email", { count: "exact", head: false })
        .gte("created_at", isoDate(start)),
      supabase.from("orders").select("customer_email", { count: "exact", head: false })
        .gte("created_at", isoDate(prevStart)).lt("created_at", isoDate(start)),
      supabase.from("order_items").select("product_name, quantity, total_price, order:orders!inner(created_at, status)")
        .gte("orders.created_at", isoDate(start)).neq("orders.status", "cancelled"),
    ]);

    const orders = ordersRes.data || [];
    const prevOrdersList = prevOrdersRes.data || [];

    // KPIs
    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const rev = activeOrders.reduce((s, o) => s + (o.total || 0), 0);
    const prevRev = prevOrdersList.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
    setRevenue(rev);
    setOrderCount(activeOrders.length);
    setCustomerCount(new Set(ordersRes.data?.map((o) => o.customer_name)).size);
    setPrevRevenue(prevRev);
    setPrevOrders(prevOrdersList.filter((o) => o.status !== "cancelled").length);
    setPrevCustomers(new Set(prevOrdersRes.data?.map((o: any) => o.customer_email)).size);

    // Status breakdown
    const statusMap: Record<string, number> = {};
    for (const o of orders) {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    }
    const breakdown = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
    setStatusBreakdown(breakdown);

    // Daily paid orders chart
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    for (const o of orders) {
      if (["paid", "confirmed", "shipped", "delivered"].includes(o.status)) {
        const key = o.created_at.slice(0, 10);
        if (key in buckets) buckets[key]++;
      }
    }
    const daily = Object.entries(buckets).map(([date, value]) => {
      const d = new Date(date + "T12:00:00");
      const label = days <= 7
        ? DAY_NAMES[d.getDay()]
        : `${d.getDate()}/${d.getMonth() + 1}`;
      return { label, value };
    });
    setDailyData(daily);

    // Recent orders
    setRecentOrders(orders.slice(0, 8));

    // Top products
    const prodMap: Record<string, { qty: number; revenue: number }> = {};
    for (const item of (itemsRes.data || [])) {
      if (!prodMap[item.product_name]) prodMap[item.product_name] = { qty: 0, revenue: 0 };
      prodMap[item.product_name].qty += item.quantity;
      prodMap[item.product_name].revenue += item.total_price || 0;
    }
    const top = Object.entries(prodMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    setTopProducts(top);

    setLoading(false);
  };

  const maxDaily = Math.max(...dailyData.map((d) => d.value), 1);
  const totalStatusOrders = statusBreakdown.reduce((s, b) => s + b.count, 0);

  const periodLabel = period === "7" ? "7 dias" : period === "30" ? "30 dias" : "90 dias";

  const kpis = [
    {
      label: "Vendas realizadas (R$)",
      value: `R$ ${fmtBRL(revenue)}`,
      prev: `R$ ${fmtBRL(prevRevenue)}`,
      pct: pctChange(revenue, prevRevenue),
      icon: DollarSign,
      iconBg: "bg-green-500",
    },
    {
      label: "Pedidos realizados",
      value: String(orderCount),
      prev: `${prevOrders} pedidos`,
      pct: pctChange(orderCount, prevOrders),
      icon: ShoppingBag,
      iconBg: "bg-[#8C2F39]",
    },
    {
      label: "Ticket médio",
      value: orderCount > 0 ? `R$ ${fmtBRL(revenue / orderCount)}` : "R$ 0,00",
      prev: prevOrders > 0 ? `R$ ${fmtBRL(prevRevenue / prevOrders)}` : "R$ 0,00",
      pct: pctChange(
        orderCount > 0 ? revenue / orderCount : 0,
        prevOrders > 0 ? prevRevenue / prevOrders : 0
      ),
      icon: TrendingUp,
      iconBg: "bg-blue-500",
    },
    {
      label: "Clientes únicos",
      value: String(customerCount),
      prev: `${prevCustomers} anteriores`,
      pct: pctChange(customerCount, prevCustomers),
      icon: Users,
      iconBg: "bg-purple-500",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance da loja</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dados em tempo real do Supabase</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
          {(["7", "30", "90"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? "bg-[#8C2F39] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Calendar size={13} />
              {p === "7" ? "7 dias" : p === "30" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const up = kpi.pct >= 0;
              return (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${kpi.iconBg} w-9 h-9 rounded-lg flex items-center justify-center`}>
                      <Icon size={17} className="text-white" />
                    </div>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
                      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(kpi.pct).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">Período anterior: {kpi.prev}</p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${up ? "bg-green-400" : "bg-red-400"}`}
                      style={{ width: `${Math.min(100, Math.abs(kpi.pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            {/* Bar chart — Evolução de pedidos pagos */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">Evolução de pedidos pagos</h3>
                <span className="text-xs text-gray-400">{periodLabel}</span>
              </div>
              <div className="flex items-end gap-1.5 h-40">
                {dailyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">{d.value > 0 ? d.value : ""}</span>
                    <div className="w-full rounded-t-md bg-blue-100 relative" style={{ height: "120px" }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-md transition-all"
                        style={{ height: `${(d.value / maxDaily) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Pedidos por status</h3>
              {statusBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum pedido no período</p>
              ) : (
                <div className="space-y-3">
                  {statusBreakdown.map(({ status, count }) => {
                    const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-400" };
                    const pct = totalStatusOrders > 0 ? (count / totalStatusOrders) * 100 : 0;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{cfg.label} ({count})</span>
                          <span className="text-gray-400">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent orders */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-700">Pedidos recentes</h3>
                <a href="/admin/pedidos" className="flex items-center gap-1 text-xs text-[#8C2F39] hover:underline">
                  Ver todos <ArrowRight size={12} />
                </a>
              </div>
              <div className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhum pedido no período</p>
                ) : recentOrders.map((o) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={o.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">#{o.order_number}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{o.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">R$ {fmtBRL(o.total)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color} text-white`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top products */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-700">Produtos mais vendidos</h3>
                <span className="text-xs text-gray-400">{periodLabel}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda no período</p>
                ) : topProducts.map((p, i) => (
                  <div key={p.name} className="px-6 py-3 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.qty} unidades</p>
                    </div>
                    <p className="text-sm font-bold text-[#8C2F39] shrink-0">R$ {fmtBRL(p.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
