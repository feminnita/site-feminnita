"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import {
  User, Package, MapPin, LogOut, ChevronRight,
  CheckCircle, Clock, Truck, XCircle,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Aguardando pagamento", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  paid: { label: "Pago", color: "text-green-600 bg-green-50", icon: CheckCircle },
  processing: { label: "Processando", color: "text-blue-600 bg-blue-50", icon: Clock },
  shipped: { label: "Enviado", color: "text-indigo-600 bg-indigo-50", icon: Truck },
  delivered: { label: "Entregue", color: "text-purple-600 bg-purple-50", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "text-red-600 bg-red-50", icon: XCircle },
};

type Tab = "pedidos" | "dados" | "enderecos";

function MinhaContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cadastroOk = searchParams.get("cadastro") === "ok";

  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("pedidos");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push("/login"); return; }
    setUser(authUser);

    const [custRes, ordersRes] = await Promise.all([
      supabase.from("customers").select("*, addresses(*)").eq("auth_id", authUser.id).single(),
      supabase.from("orders").select("*, items:order_items(*)").eq(
        "customer_id",
        (await supabase.from("customers").select("id").eq("auth_id", authUser.id).single()).data?.id || ""
      ).order("created_at", { ascending: false }),
    ]);

    if (custRes.data) {
      setCustomer(custRes.data);
      setAddresses(custRes.data.addresses || []);
    }
    setOrders(ordersRes.data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "pedidos", label: "Meus Pedidos", icon: Package },
    { id: "dados", label: "Meus Dados", icon: User },
    { id: "enderecos", label: "Endereços", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {cadastroOk && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800 text-sm">
            ✅ Conta criada com sucesso! Bem-vinda à Feminnita, {customer?.name?.split(" ")[0] || ""}!
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {customer?.name?.split(" ")[0] || user?.email}!
            </h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-[#8C2F39] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === "pedidos" && (
          <div>
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">Você ainda não fez nenhum pedido</p>
                <Link href="/produtos">
                  <button className="bg-[#8C2F39] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#7a2832]">
                    Ver produtos
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900">#{order.order_number}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${cfg.color}`}>
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#8C2F39]">
                            R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">{order.items?.length || 0} iten(s)</p>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          {order.items.slice(0, 2).map((item: any, i: number) => (
                            <p key={i} className="text-xs text-gray-500">
                              {item.quantity}× {item.product_name}
                              {item.size ? ` — ${item.size}` : ""}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-400">+{order.items.length - 2} mais</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile data */}
        {tab === "dados" && customer && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-5">Meus Dados</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Nome completo", value: customer.name },
                { label: "E-mail", value: customer.email },
                { label: "Telefone", value: customer.phone || "—" },
                { label: "CPF", value: customer.cpf || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-gray-500 mb-1">{label}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-6">
              Para alterar seus dados, entre em contato conosco pelo WhatsApp.
            </p>
          </div>
        )}

        {/* Addresses */}
        {tab === "enderecos" && (
          <div>
            {addresses.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhum endereço cadastrado.</p>
                <p className="text-xs text-gray-400 mt-2">Os endereços são salvos automaticamente quando você finaliza um pedido.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin size={16} className="text-[#8C2F39]" />
                      <span className="font-medium text-sm">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-[#8C2F39]/10 text-[#8C2F39] px-2 py-0.5 rounded-full">Principal</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{addr.street}, {addr.number}</p>
                    {addr.complement && <p className="text-sm text-gray-500">{addr.complement}</p>}
                    <p className="text-sm text-gray-700">{addr.neighborhood}</p>
                    <p className="text-sm text-gray-700">{addr.city} — {addr.state}</p>
                    <p className="text-sm text-gray-500">CEP: {addr.cep}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MinhaContaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MinhaContaContent />
    </Suspense>
  );
}
