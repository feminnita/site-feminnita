"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";

type Stats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;
  recentOrders: any[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    paidOrders: 0,
    shippedOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const supabase = createClient();

    const [productsRes, ordersRes, customersRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("orders").select("id, status, total, order_number, created_at, shipping_address"),
      supabase.from("customers").select("id", { count: "exact", head: true }),
    ]);

    const orders = ordersRes.data || [];
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    setStats({
      totalProducts: productsRes.count || 0,
      totalOrders: orders.length,
      totalRevenue,
      totalCustomers: customersRes.count || 0,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      paidOrders: orders.filter((o) => o.status === "paid").length,
      shippedOrders: orders.filter((o) => o.status === "shipped").length,
      recentOrders: orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    });
    setLoading(false);
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle },
    processing: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: Clock },
    shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-800", icon: Truck },
    delivered: { label: "Entregue", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: Clock },
  };

  const cards = [
    {
      title: "Produtos Ativos",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500",
      format: "number",
    },
    {
      title: "Total de Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-[#8C2F39]",
      format: "number",
    },
    {
      title: "Receita Total",
      value: stats.totalRevenue,
      icon: DollarSign,
      color: "bg-green-500",
      format: "currency",
    },
    {
      title: "Clientes",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-purple-500",
      format: "number",
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do seu e-commerce</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <p className="text-sm text-gray-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {card.format === "currency"
                  ? `R$ ${card.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-800">Aguardando pagamento</p>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{stats.pendingOrders}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-green-600" />
            <p className="text-sm font-semibold text-green-800">Pagos</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{stats.paidOrders}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-indigo-600" />
            <p className="text-sm font-semibold text-indigo-800">Em transporte</p>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{stats.shippedOrders}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Pedidos Recentes</h2>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-4" />
            <p>Nenhum pedido ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              const Icon = cfg.icon;
              const addr = order.shipping_address as any;
              return (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900">#{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {addr?.city ? `${addr.city}/${addr.state}` : "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${cfg.color}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
