"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, ShoppingCart, DollarSign, Package } from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  created_at: string;
  customers: { name: string; email: string } | null;
};

const periods = [
  { label: "Hoje", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

export default function AdminVendasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const from = new Date();
      from.setDate(from.getDate() - period);
      const { data } = await supabase
        .from("orders")
        .select("*, customers(name, email)")
        .gte("created_at", from.toISOString())
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    load();
  }, [period]);

  const paid = orders.filter((o) => o.payment_status === "paid");
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const avgTicket = paid.length ? revenue / paid.length : 0;
  const conversion = orders.length ? (paid.length / orders.length) * 100 : 0;

  const byMethod = orders.reduce((acc: any, o) => {
    acc[o.payment_method] = (acc[o.payment_method] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Relatório de Vendas</h1>
          <p className="text-gray-500 mt-1">Acompanhe o desempenho da sua loja</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.days
                  ? "bg-[#8C2F39] text-white"
                  : "bg-white border hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Receita Total", value: `R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <DollarSign size={20} />, color: "text-green-600 bg-green-50" },
          { label: "Pedidos Pagos", value: paid.length, icon: <ShoppingCart size={20} />, color: "text-blue-600 bg-blue-50" },
          { label: "Ticket Médio", value: `R$ ${avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <TrendingUp size={20} />, color: "text-purple-600 bg-purple-50" },
          { label: "Conversão", value: `${conversion.toFixed(1)}%`, icon: <Package size={20} />, color: "text-orange-600 bg-orange-50" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${m.color}`}>
              {m.icon}
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-sm text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Por status */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Por Status</h3>
          {["pending","paid","processing","shipped","delivered","cancelled"].map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            const labels: any = { pending: "Aguardando", paid: "Pago", processing: "Em preparo", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado" };
            const colors: any = { pending: "bg-yellow-100 text-yellow-700", paid: "bg-green-100 text-green-700", processing: "bg-blue-100 text-blue-700", shipped: "bg-purple-100 text-purple-700", delivered: "bg-gray-100 text-gray-700", cancelled: "bg-red-100 text-red-700" };
            return count > 0 ? (
              <div key={s} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[s]}`}>{labels[s]}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ) : null;
          })}
          {orders.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum pedido no período</p>}
        </div>

        {/* Por pagamento */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Por Pagamento</h3>
          {Object.entries(byMethod).map(([method, count]: any) => (
            <div key={method} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm capitalize">{method === "credit_card" ? "Cartão de Crédito" : method === "pix" ? "PIX" : "Boleto"}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
          {Object.keys(byMethod).length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum pedido no período</p>}
        </div>

        {/* Resumo financeiro */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Resumo Financeiro</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal produtos</span>
              <span>R$ {orders.reduce((s, o) => s + o.subtotal, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Frete cobrado</span>
              <span>R$ {orders.reduce((s, o) => s + o.shipping_cost, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Descontos dados</span>
              <span>- R$ {orders.reduce((s, o) => s + o.discount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span className="text-green-600">R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de pedidos */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Todos os pedidos do período</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum pedido encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Pedido</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Pagamento</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="px-4 py-3">{order.customers?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 capitalize">{order.payment_method === "credit_card" ? "Cartão" : order.payment_method?.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.payment_status === "paid" ? "bg-green-100 text-green-700" :
                        order.payment_status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.payment_status === "paid" ? "Pago" : order.payment_status === "failed" ? "Falhou" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
