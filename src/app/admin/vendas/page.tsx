"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp, ShoppingCart, DollarSign, BarChart2,
  Download, RefreshCw, Package, CreditCard, Smartphone, FileText
} from "lucide-react";

type Period = "7" | "30" | "90" | "365";
type Tab = "vendas" | "pagamentos" | "resultado" | "extrato" | "produtos";

interface DailySale { date: string; revenue: number; orders: number }
interface PaymentMethodData { method: string; count: number; revenue: number }
interface TopProduct { product_id: string; name: string; qty: number; revenue: number }
interface OrderRow {
  id: string; created_at: string; status: string;
  total_amount: number; payment_method: string; customer_name: string;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}
function subDays(d: Date, days: number) {
  const r = new Date(d); r.setDate(r.getDate() - days); return r;
}

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pix:         { label: "PIX",               icon: <Smartphone size={13} />, color: "text-green-600 bg-green-50" },
  boleto:      { label: "Boleto",            icon: <FileText size={13} />,   color: "text-orange-600 bg-orange-50" },
  credit_card: { label: "Cartão de Crédito", icon: <CreditCard size={13} />, color: "text-blue-600 bg-blue-50" },
  debit_card:  { label: "Cartão de Débito",  icon: <CreditCard size={13} />, color: "text-indigo-600 bg-indigo-50" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendente",    color: "bg-yellow-100 text-yellow-700" },
  confirmed:  { label: "Confirmado",  color: "bg-blue-100 text-blue-700" },
  paid:       { label: "Pago",        color: "bg-green-100 text-green-700" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-700" },
  shipped:    { label: "Enviado",     color: "bg-indigo-100 text-indigo-700" },
  delivered:  { label: "Entregue",    color: "bg-purple-100 text-purple-700" },
  cancelled:  { label: "Cancelado",   color: "bg-red-100 text-red-700" },
};

const PAID_STATUSES = ["paid", "confirmed", "shipped", "delivered"];

const TABS: { id: Tab; label: string }[] = [
  { id: "vendas",     label: "Vendas por período" },
  { id: "pagamentos", label: "Formas de pagamento" },
  { id: "resultado",  label: "Resultado econômico" },
  { id: "extrato",    label: "Extrato de pedidos" },
  { id: "produtos",   label: "Produtos mais vendidos" },
];

export default function VendasPage() {
  const supabase = createClient();
  const [period, setPeriod] = useState<Period>("30");
  const [tab, setTab] = useState<Tab>("vendas");
  const [loading, setLoading] = useState(true);

  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentMethodData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paidRevenue, setPaidRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const from = subDays(now, parseInt(period)).toISOString();

    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, created_at, status, total_amount, payment_method, customer_name")
      .gte("created_at", from)
      .order("created_at", { ascending: false });

    if (!allOrders) { setLoading(false); return; }

    setOrders(allOrders);

    const paid = allOrders.filter(o => PAID_STATUSES.includes(o.status));
    const cancelled = allOrders.filter(o => o.status === "cancelled");
    const rev = paid.reduce((s, o) => s + (o.total_amount || 0), 0);
    const allRev = allOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

    setTotalRevenue(allRev);
    setPaidRevenue(rev);
    setTotalOrders(allOrders.length);
    setAvgTicket(paid.length > 0 ? rev / paid.length : 0);
    setCancelledCount(cancelled.length);

    // Daily sales
    const dayMap: Record<string, DailySale> = {};
    for (let i = 0; i < parseInt(period); i++) {
      const key = subDays(now, i).toISOString().slice(0, 10);
      dayMap[key] = { date: key, revenue: 0, orders: 0 };
    }
    for (const o of paid) {
      const key = o.created_at.slice(0, 10);
      if (dayMap[key]) { dayMap[key].revenue += o.total_amount || 0; dayMap[key].orders++; }
    }
    setDailySales(Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)));

    // Payment method breakdown
    const pmMap: Record<string, PaymentMethodData> = {};
    for (const o of paid) {
      const m = o.payment_method || "other";
      if (!pmMap[m]) pmMap[m] = { method: m, count: 0, revenue: 0 };
      pmMap[m].count++;
      pmMap[m].revenue += o.total_amount || 0;
    }
    setPaymentData(Object.values(pmMap).sort((a, b) => b.revenue - a.revenue));

    // Top products
    const orderIds = paid.map(o => o.id);
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, unit_price")
        .in("order_id", orderIds);
      if (items) {
        const prodMap: Record<string, TopProduct> = {};
        for (const item of items) {
          const pid = item.product_id || item.product_name;
          if (!prodMap[pid]) prodMap[pid] = { product_id: pid, name: item.product_name, qty: 0, revenue: 0 };
          prodMap[pid].qty += item.quantity || 1;
          prodMap[pid].revenue += (item.unit_price || 0) * (item.quantity || 1);
        }
        setTopProducts(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 20));
      }
    } else {
      setTopProducts([]);
    }

    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

  function exportCSV() {
    const rows = [
      ["Data", "Cliente", "Pagamento", "Status", "Total"],
      ...orders.map(o => [
        fmtDate(o.created_at),
        o.customer_name || "",
        PAYMENT_LABELS[o.payment_method]?.label || o.payment_method || "",
        STATUS_LABELS[o.status]?.label || o.status,
        `R$ ${fmtBRL(o.total_amount || 0)}`,
      ])
    ];
    const blob = new Blob(["﻿" + rows.map(r => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pedidos-${period}dias.csv`;
    a.click();
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios de Vendas</h1>
          <p className="text-gray-500 mt-1">Análise detalhada do desempenho da loja</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {(["7", "30", "90", "365"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === p ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p === "365" ? "12m" : `${p}d`}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm text-gray-500"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Receita confirmada", value: `R$ ${fmtBRL(paidRevenue)}`,     icon: DollarSign,  color: "text-green-600" },
          { label: "Pedidos no período", value: totalOrders.toString(),            icon: ShoppingCart, color: "text-blue-600" },
          { label: "Ticket médio",       value: `R$ ${fmtBRL(avgTicket)}`,        icon: TrendingUp,   color: "text-purple-600" },
          { label: "Cancelados",         value: cancelledCount.toString(),          icon: BarChart2,    color: "text-red-500" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "text-[#8C2F39] border-b-2 border-[#8C2F39]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Carregando...
            </div>
          ) : (
            <>
              {/* ── Vendas por período ── */}
              {tab === "vendas" && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4">Evolução de vendas — últimos {period} dias</h3>
                  {/* Bar chart */}
                  <div className="flex items-end gap-0.5 h-44 mb-2 px-1">
                    {dailySales.map(d => (
                      <div key={d.date} className="flex-1 group relative flex flex-col items-center justify-end">
                        <div
                          className="w-full bg-[#8C2F39] rounded-t-sm hover:bg-[#6d2430] transition-colors cursor-default"
                          style={{
                            height: `${(d.revenue / maxRevenue) * 100}%`,
                            minHeight: d.revenue > 0 ? "4px" : "1px",
                            opacity: d.revenue > 0 ? 1 : 0.1,
                          }}
                        />
                        {d.revenue > 0 && (
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                            R$ {fmtBRL(d.revenue)}<br />{d.orders} ped.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-0.5 text-[9px] text-gray-400 mb-6 px-1">
                    {dailySales.map((d, i) => (
                      <div key={d.date} className="flex-1 text-center truncate">
                        {(parseInt(period) <= 14 || i % Math.ceil(parseInt(period) / 10) === 0)
                          ? d.date.slice(5) : ""}
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-auto max-h-72 rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="text-xs text-gray-500">
                          <th className="text-left px-4 py-2.5">Data</th>
                          <th className="text-right px-4 py-2.5">Pedidos pagos</th>
                          <th className="text-right px-4 py-2.5">Receita</th>
                          <th className="text-right px-4 py-2.5">Ticket médio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {[...dailySales].reverse().map(d => (
                          <tr key={d.date} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-700">
                              {new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{d.orders}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-900">R$ {fmtBRL(d.revenue)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">
                              {d.orders > 0 ? `R$ ${fmtBRL(d.revenue / d.orders)}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="font-semibold text-sm">
                          <td className="px-4 py-2.5 text-gray-900">Total</td>
                          <td className="px-4 py-2.5 text-right text-gray-900">
                            {dailySales.reduce((s, d) => s + d.orders, 0)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-900">R$ {fmtBRL(paidRevenue)}</td>
                          <td className="px-4 py-2.5 text-right text-gray-500">
                            {dailySales.reduce((s, d) => s + d.orders, 0) > 0
                              ? `R$ ${fmtBRL(paidRevenue / dailySales.reduce((s, d) => s + d.orders, 0))}`
                              : "—"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Formas de pagamento ── */}
              {tab === "pagamentos" && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-6">Formas de pagamento — pedidos pagos</h3>
                  {paymentData.length === 0 ? (
                    <p className="text-gray-400 text-center py-12">Nenhum pedido pago no período</p>
                  ) : (
                    <>
                      <div className="space-y-5 mb-8">
                        {paymentData.map(pm => {
                          const config = PAYMENT_LABELS[pm.method];
                          const pct = paidRevenue > 0 ? (pm.revenue / paidRevenue) * 100 : 0;
                          return (
                            <div key={pm.method}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config?.color || "bg-gray-100 text-gray-600"}`}>
                                    {config?.icon}
                                    {config?.label || pm.method}
                                  </span>
                                  <span className="text-sm text-gray-500">{pm.count} pedido{pm.count !== 1 ? "s" : ""}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-gray-900">R$ {fmtBRL(pm.revenue)}</span>
                                  <span className="text-sm text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-[#8C2F39] h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr className="text-xs text-gray-500">
                              <th className="text-left px-4 py-2.5">Método</th>
                              <th className="text-right px-4 py-2.5">Pedidos</th>
                              <th className="text-right px-4 py-2.5">% do total</th>
                              <th className="text-right px-4 py-2.5">Receita</th>
                              <th className="text-right px-4 py-2.5">Ticket médio</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 bg-white">
                            {paymentData.map(pm => (
                              <tr key={pm.method} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 text-gray-700">{PAYMENT_LABELS[pm.method]?.label || pm.method}</td>
                                <td className="px-4 py-2.5 text-right text-gray-700">{pm.count}</td>
                                <td className="px-4 py-2.5 text-right text-gray-500">
                                  {paidRevenue > 0 ? ((pm.revenue / paidRevenue) * 100).toFixed(1) : "0"}%
                                </td>
                                <td className="px-4 py-2.5 text-right font-medium text-gray-900">R$ {fmtBRL(pm.revenue)}</td>
                                <td className="px-4 py-2.5 text-right text-gray-500">R$ {fmtBRL(pm.revenue / pm.count)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Resultado econômico ── */}
              {tab === "resultado" && (
                <div className="max-w-lg">
                  <h3 className="font-semibold text-gray-700 mb-6">Resultado econômico — últimos {period} dias</h3>
                  <div className="space-y-0 rounded-xl border border-gray-100 overflow-hidden">
                    {[
                      { label: "Receita bruta (todos os pedidos)", value: totalRevenue, cls: "bg-white" },
                      { label: "Pedidos cancelados",               value: -orders.filter(o => o.status === "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0), cls: "bg-white text-red-600" },
                      { label: "Pedidos pendentes",                value: orders.filter(o => o.status === "pending").reduce((s, o) => s + (o.total_amount || 0), 0), cls: "bg-white text-yellow-700" },
                      { label: "Receita confirmada",               value: paidRevenue, cls: "bg-green-50 font-semibold", bold: true },
                    ].map(row => (
                      <div key={row.label} className={`flex justify-between items-center px-5 py-3.5 border-b last:border-0 ${row.cls}`}>
                        <span className={`text-sm ${row.bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>{row.label}</span>
                        <span className={`font-medium tabular-nums text-sm ${row.bold ? "text-green-700 text-base font-bold" : ""}`}>
                          {row.value < 0 ? `- R$ ${fmtBRL(-row.value)}` : `R$ ${fmtBRL(row.value)}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-2xl p-5">
                      <p className="text-sm text-green-700 mb-1">Receita confirmada</p>
                      <p className="text-2xl font-bold text-green-800">R$ {fmtBRL(paidRevenue)}</p>
                      <p className="text-xs text-green-600 mt-1">{orders.filter(o => PAID_STATUSES.includes(o.status)).length} pedidos</p>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-5">
                      <p className="text-sm text-yellow-700 mb-1">Aguardando pagamento</p>
                      <p className="text-2xl font-bold text-yellow-800">
                        R$ {fmtBRL(orders.filter(o => o.status === "pending").reduce((s, o) => s + (o.total_amount || 0), 0))}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">{orders.filter(o => o.status === "pending").length} pedidos</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Extrato de pedidos ── */}
              {tab === "extrato" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">{orders.length} pedidos nos últimos {period} dias</h3>
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700"
                    >
                      <Download size={14} /> Exportar CSV
                    </button>
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-auto max-h-[480px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr className="text-xs text-gray-500">
                            <th className="text-left px-4 py-2.5">Data</th>
                            <th className="text-left px-4 py-2.5">Cliente</th>
                            <th className="text-left px-4 py-2.5">Pagamento</th>
                            <th className="text-left px-4 py-2.5">Status</th>
                            <th className="text-right px-4 py-2.5">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                          {orders.map(o => {
                            const st = STATUS_LABELS[o.status] || { label: o.status, color: "bg-gray-100 text-gray-600" };
                            const pm = PAYMENT_LABELS[o.payment_method];
                            return (
                              <tr key={o.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(o.created_at)}</td>
                                <td className="px-4 py-2.5 text-gray-700 max-w-[180px] truncate">{o.customer_name || "—"}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`flex items-center gap-1 w-fit text-xs px-2 py-0.5 rounded-full font-medium ${pm?.color || "bg-gray-100 text-gray-600"}`}>
                                    {pm?.icon}{pm?.label || o.payment_method || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                                </td>
                                <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                                  R$ {fmtBRL(o.total_amount || 0)}
                                </td>
                              </tr>
                            );
                          })}
                          {orders.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-gray-400">
                                Nenhum pedido no período selecionado
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Produtos mais vendidos ── */}
              {tab === "produtos" && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4">Top 20 produtos — por receita gerada</h3>
                  {topProducts.length === 0 ? (
                    <p className="text-gray-400 text-center py-12">Nenhuma venda no período</p>
                  ) : (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-xs text-gray-500">
                            <th className="text-left px-4 py-2.5 w-8">#</th>
                            <th className="text-left px-4 py-2.5">Produto</th>
                            <th className="text-right px-4 py-2.5">Unidades</th>
                            <th className="text-right px-4 py-2.5">Receita</th>
                            <th className="text-right px-4 py-2.5 w-40">% do total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                          {topProducts.map((p, i) => (
                            <tr key={p.product_id} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <Package size={13} className="text-gray-400" />
                                  </div>
                                  <span className="text-gray-700 font-medium max-w-[260px] truncate">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-600">{p.qty}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">R$ {fmtBRL(p.revenue)}</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                    <div
                                      className="bg-[#8C2F39] h-1.5 rounded-full"
                                      style={{ width: `${(p.revenue / (topProducts[0]?.revenue || 1)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-400 text-xs w-10 text-right">
                                    {paidRevenue > 0 ? ((p.revenue / paidRevenue) * 100).toFixed(1) : "0"}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
