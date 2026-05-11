"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Filter,
  Package,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
} from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_address: any;
  notes: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  items?: any[];
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: Clock },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Entregue", color: "bg-purple-100 text-purple-800", icon: Package },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
};

const paymentLabels: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  credit_card: "Cartão de Crédito",
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customers(name, email),
        items:order_items(*)
      `)
      .order("created_at", { ascending: false });

    const mapped = (data || []).map((o: any) => ({
      ...o,
      customer_name: o.customer?.name || "Cliente não identificado",
      customer_email: o.customer?.email || "",
      items: o.items || [],
    }));
    setOrders(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selected?.id === orderId) {
      setSelected((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">{orders.length} pedidos no total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-5">
          <p className="text-sm text-yellow-700 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-700">
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-5">
          <p className="text-sm text-green-700 mb-1">Pagos</p>
          <p className="text-2xl font-bold text-green-700">
            {orders.filter((o) => o.status === "paid").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Receita</p>
          <p className="text-xl font-bold text-[#8C2F39]">
            R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por pedido, nome ou email..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39] text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#8C2F39] appearance-none bg-white"
              >
                <option value="all">Todos os status</option>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Package size={48} className="mx-auto mb-3" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((order) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  const addr = order.shipping_address as any;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelected(order)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selected?.id === order.id ? "bg-rose-50 border-l-4 border-[#8C2F39]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">#{order.order_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                              <Icon size={11} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.items?.length || 0} iten(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="w-80 shrink-0">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">#{selected.order_number}</h3>
                  <p className="text-xs text-gray-400">
                    {new Date(selected.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Status update */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Status</p>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected.id, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#8C2F39]"
                  >
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Customer */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Cliente</p>
                  <p className="font-medium text-sm">{selected.customer_name}</p>
                  <p className="text-xs text-gray-500">{selected.customer_email}</p>
                </div>

                {/* Address */}
                {selected.shipping_address && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Entrega</p>
                    {(() => {
                      const a = selected.shipping_address as any;
                      return (
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p>{a.street}, {a.number}{a.complement ? `, ${a.complement}` : ""}</p>
                          <p>{a.neighborhood} — {a.city}/{a.state}</p>
                          <p>CEP: {a.cep}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Items */}
                {selected.items && selected.items.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Itens</p>
                    <div className="space-y-1">
                      {selected.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-700">
                            {item.quantity}× {item.product_name}
                            {item.size ? ` (${item.size})` : ""}
                          </span>
                          <span className="font-medium">
                            R$ {item.total_price?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t pt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R$ {selected.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frete</span>
                    <span>R$ {selected.shipping_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selected.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>- R$ {selected.discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#8C2F39]">R$ {selected.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selected.payment_method && (
                    <p className="text-xs text-gray-400 pt-1">
                      {paymentLabels[selected.payment_method] || selected.payment_method}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <Eye size={40} className="mx-auto mb-3" />
              <p className="text-sm">Clique em um pedido para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
