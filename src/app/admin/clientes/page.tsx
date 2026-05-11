"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Users, MapPin, Phone, Mail, Calendar } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  created_at: string;
  order_count?: number;
  total_spent?: number;
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("customers")
      .select(`
        *,
        orders(id, total, status)
      `)
      .order("created_at", { ascending: false });

    const mapped = (data || []).map((c: any) => {
      const orders = c.orders || [];
      return {
        ...c,
        order_count: orders.length,
        total_spent: orders
          .filter((o: any) => o.status !== "cancelled")
          .reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      };
    });
    setCustomers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectCustomer = async (customer: Customer) => {
    setSelected(customer);
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", customer.id);
    setAddresses(data || []);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search)
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 mt-1">{customers.length} clientes cadastrados</p>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou telefone..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39] text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-3" />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {filtered.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selected?.id === customer.id ? "bg-rose-50 border-l-4 border-[#8C2F39]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                        {customer.phone && (
                          <p className="text-xs text-gray-400">{customer.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {customer.order_count} pedido(s)
                        </p>
                        <p className="text-sm text-[#8C2F39] font-semibold">
                          R$ {(customer.total_spent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="w-72 shrink-0">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-[#8C2F39]/10 flex items-center justify-center">
                  <span className="text-[#8C2F39] font-bold text-lg">
                    {selected.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-sm">
                  ✕
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900">{selected.name}</h3>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    {selected.email}
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {selected.phone}
                    </div>
                  )}
                  {selected.birth_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(selected.birth_date).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selected.order_count}</p>
                  <p className="text-xs text-gray-500">pedidos</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#8C2F39]">
                    R${(selected.total_spent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500">total gasto</p>
                </div>
              </div>

              {addresses.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endereços</p>
                  </div>
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{addr.label}</p>
                        <p>{addr.street}, {addr.number}</p>
                        <p>{addr.neighborhood} — {addr.city}/{addr.state}</p>
                        <p>CEP: {addr.cep}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 pt-2 border-t">
                Cadastrado em {new Date(selected.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3" />
              <p className="text-sm">Clique em um cliente para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
