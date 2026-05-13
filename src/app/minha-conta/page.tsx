"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { User, Package, MapPin, LogOut, CheckCircle, Clock, Truck, XCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; dotCls: string; icon: any }> = {
  pending:    { label: "Aguardando pagamento", dotCls: "bg-yellow-400", icon: Clock },
  paid:       { label: "Pago",                dotCls: "bg-green-500",  icon: CheckCircle },
  processing: { label: "Processando",         dotCls: "bg-blue-400",   icon: Clock },
  shipped:    { label: "Enviado",             dotCls: "bg-indigo-400", icon: Truck },
  delivered:  { label: "Entregue",            dotCls: "bg-purple-400", icon: CheckCircle },
  cancelled:  { label: "Cancelado",           dotCls: "bg-red-400",    icon: XCircle },
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push("/login"); return; }
    setUser(authUser);

    const custRes = await supabase.from("customers").select("*, addresses(*)").eq("auth_id", authUser.id).single();
    const custId = custRes.data?.id || "";
    const ordersRes = await supabase.from("orders").select("*, items:order_items(*)").eq("customer_id", custId).order("created_at", { ascending: false });

    if (custRes.data) { setCustomer(custRes.data); setAddresses(custRes.data.addresses || []); }
    setOrders(ordersRes.data || []);
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh(); };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex justify-center py-32">
          <div className="w-6 h-6 border-2 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: "pedidos",   label: "Meus Pedidos", Icon: Package },
    { id: "dados",     label: "Meus Dados",   Icon: User },
    { id: "enderecos", label: "Endereços",    Icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1000px] mx-auto px-6 py-10">

        {cadastroOk && (
          <div className="border border-green-200 bg-green-50 px-5 py-3 mb-6 text-[12px] text-green-700">
            Conta criada com sucesso! Bem-vinda à Feminnita{customer?.name ? `, ${customer.name.split(" ")[0]}` : ""}!
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Bem-vinda,</p>
            <h1 className="text-[20px] font-light text-gray-900 mt-0.5">
              {customer?.name?.split(" ")[0] || user?.email}
            </h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-400 hover:text-[#8C2F39] transition-colors">
            <LogOut size={13} /> Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-8">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-widest border-b-2 -mb-px transition-colors ${
                tab === id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Pedidos */}
        {tab === "pedidos" && (
          orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} strokeWidth={1} className="mx-auto text-gray-200 mb-5" />
              <p className="text-[13px] text-gray-400 mb-6">Você ainda não fez nenhum pedido</p>
              <Link href="/" className="text-[11px] uppercase tracking-widest border border-gray-800 px-8 py-3 hover:bg-gray-800 hover:text-white transition-colors">
                Ver coleções
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div key={order.id} className="border border-gray-100 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[12px] font-medium text-gray-800">#{order.order_number}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`w-2 h-2 rounded-full ${cfg.dotCls}`} />
                          <span className="text-[11px] text-gray-500">{cfg.label}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-gray-900">
                          R$ {order.total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-gray-400">{order.items?.length || 0} item(s)</p>
                      </div>
                    </div>
                    {order.items?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                        {order.items.slice(0, 2).map((item: any, i: number) => (
                          <p key={i} className="text-[11px] text-gray-500">
                            {item.quantity}× {item.product_name}{item.size ? ` — ${item.size}` : ""}
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-[11px] text-gray-400">+{order.items.length - 2} mais</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Dados */}
        {tab === "dados" && customer && (
          <div className="border border-gray-100 p-6">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-6">Informações Pessoais</p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: "Nome completo", value: customer.name },
                { label: "E-mail",        value: customer.email },
                { label: "Telefone",      value: customer.phone || "—" },
                { label: "CPF",           value: customer.cpf   || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                  <p className="text-[13px] text-gray-800">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-8">
              Para alterar seus dados, entre em contato conosco pelo WhatsApp.
            </p>
          </div>
        )}

        {/* Endereços */}
        {tab === "enderecos" && (
          addresses.length === 0 ? (
            <div className="text-center py-20">
              <MapPin size={40} strokeWidth={1} className="mx-auto text-gray-200 mb-5" />
              <p className="text-[13px] text-gray-400 mb-2">Nenhum endereço cadastrado</p>
              <p className="text-[11px] text-gray-400">Os endereços são salvos ao finalizar um pedido.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr.id} className="border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-[12px] font-medium text-gray-800">{addr.label}</p>
                    {addr.is_default && (
                      <span className="text-[10px] border border-[#8C2F39] text-[#8C2F39] px-2 py-0.5 uppercase tracking-widest">Principal</span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-600">{addr.street}, {addr.number}</p>
                  {addr.complement && <p className="text-[12px] text-gray-500">{addr.complement}</p>}
                  <p className="text-[12px] text-gray-600">{addr.neighborhood}</p>
                  <p className="text-[12px] text-gray-600">{addr.city} — {addr.state}</p>
                  <p className="text-[12px] text-gray-400 mt-1">CEP: {addr.cep}</p>
                </div>
              ))}
            </div>
          )
        )}

      </div>
      <Footer />
    </div>
  );
}

export default function MinhaContaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MinhaContaContent />
    </Suspense>
  );
}
