"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search, Users, MapPin, Phone, Mail, Calendar,
  ShoppingBag, ChevronLeft, ChevronRight, Download,
  MessageCircle, TrendingUp, UserPlus, X,
} from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};

type CustomerOrder = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  payment_method: string | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendente",    color: "bg-yellow-100 text-yellow-700" },
  paid:       { label: "Pago",        color: "bg-green-100 text-green-700" },
  confirmed:  { label: "Confirmado",  color: "bg-blue-100 text-blue-700" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-700" },
  shipped:    { label: "Enviado",     color: "bg-indigo-100 text-indigo-700" },
  delivered:  { label: "Entregue",    color: "bg-purple-100 text-purple-700" },
  cancelled:  { label: "Cancelado",   color: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 25;

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function ClientesPage() {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail panel
  const [selected, setSelected] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [custOrders, setCustOrders] = useState<CustomerOrder[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // KPIs
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("customers")
      .select("id, name, email, phone, cpf, birth_date, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (debouncedSearch) {
      query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);
    }

    const { data: rows, count } = await query;
    setTotal(count || 0);

    // Enrich with order stats
    const ids = (rows || []).map((c: any) => c.id);
    let orderMap: Record<string, { count: number; total: number; last: string | null }> = {};

    if (ids.length > 0) {
      const { data: ords } = await supabase
        .from("orders")
        .select("customer_id, total_amount, status, created_at")
        .in("customer_id", ids);

      for (const o of ords || []) {
        if (!orderMap[o.customer_id]) orderMap[o.customer_id] = { count: 0, total: 0, last: null };
        orderMap[o.customer_id].count++;
        if (o.status !== "cancelled") orderMap[o.customer_id].total += o.total_amount || 0;
        if (!orderMap[o.customer_id].last || o.created_at > orderMap[o.customer_id].last!) {
          orderMap[o.customer_id].last = o.created_at;
        }
      }
    }

    setCustomers((rows || []).map((c: any) => ({
      ...c,
      order_count: orderMap[c.id]?.count || 0,
      total_spent: orderMap[c.id]?.total || 0,
      last_order_at: orderMap[c.id]?.last || null,
    })));
    setLoading(false);
  }, [page, debouncedSearch]);

  // KPI load (once)
  useEffect(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
    ]).then(([all, month]) => {
      setTotalCustomers(all.count || 0);
      setNewThisMonth(month.count || 0);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (c: Customer) => {
    setSelected(c);
    setDetailLoading(true);
    const [addrRes, ordRes] = await Promise.all([
      supabase.from("addresses").select("*").eq("customer_id", c.id),
      supabase.from("orders").select("id, created_at, status, total_amount, payment_method").eq("customer_id", c.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setAddresses(addrRes.data || []);
    setCustOrders((ordRes.data || []) as CustomerOrder[]);
    setDetailLoading(false);
  };

  function exportCSV() {
    const rows = [
      ["Nome", "Email", "Telefone", "CPF", "Pedidos", "Total gasto", "Cadastro"],
      ...customers.map(c => [
        c.name, c.email, c.phone || "", c.cpf || "",
        c.order_count, `R$ ${fmtBRL(c.total_spent)}`,
        new Date(c.created_at).toLocaleDateString("pt-BR"),
      ])
    ];
    const blob = new Blob(["﻿" + rows.map(r => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clientes.csv";
    a.click();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">{totalCustomers} clientes cadastrados</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 shadow-sm"
        >
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
            <p className="text-sm text-gray-500">Total de clientes</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <UserPlus size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{newThisMonth}</p>
            <p className="text-sm text-gray-500">Novos este mês</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <TrendingUp size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {customers.length > 0
                ? `R$ ${fmtBRL(customers.reduce((s, c) => s + c.total_spent, 0) / (customers.filter(c => c.order_count > 0).length || 1))}`
                : "—"}
            </p>
            <p className="text-sm text-gray-500">LTV médio (página)</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou telefone..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C2F39]"
              />
            </div>
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 p-2">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-7 h-7 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <Users size={40} className="mx-auto mb-3" />
                <p>Nenhum cliente encontrado</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-500">
                      <th className="text-left px-5 py-3">Cliente</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Cadastro</th>
                      <th className="text-right px-5 py-3">Pedidos</th>
                      <th className="text-right px-5 py-3">Total gasto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => openDetail(c)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === c.id ? "bg-rose-50" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#8C2F39]/10 flex items-center justify-center shrink-0">
                              <span className="text-[#8C2F39] font-bold text-sm">{c.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{c.name}</p>
                              <p className="text-xs text-gray-400">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-gray-700 font-medium">{c.order_count}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-[#8C2F39]">
                          R$ {fmtBRL(c.total_spent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50">
                    <p className="text-xs text-gray-400">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm px-2 text-gray-700">{page} / {totalPages}</span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-80 shrink-0 sticky top-6">
          {selected ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#8C2F39]/10 flex items-center justify-center">
                    <span className="text-[#8C2F39] font-bold text-xl">{selected.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={16} />
                  </button>
                </div>
                <h3 className="font-bold text-lg text-gray-900">{selected.name}</h3>
                <div className="mt-2 space-y-1.5">
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#8C2F39]">
                    <Mail size={13} className="text-gray-400" /> {selected.email}
                  </a>
                  {selected.phone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#8C2F39]">
                        <Phone size={13} className="text-gray-400" /> {selected.phone}
                      </a>
                      <a
                        href={`https://wa.me/55${selected.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full hover:bg-green-600"
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </a>
                    </div>
                  )}
                  {selected.birth_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      {new Date(selected.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </div>
                  )}
                  {selected.cpf && (
                    <p className="text-xs text-gray-400 pl-5">CPF: {selected.cpf}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 divide-x divide-gray-50 border-b border-gray-50">
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selected.order_count}</p>
                  <p className="text-xs text-gray-500">pedidos</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-lg font-bold text-[#8C2F39]">R$ {fmtBRL(selected.total_spent)}</p>
                  <p className="text-xs text-gray-500">total gasto</p>
                </div>
              </div>

              {/* Orders */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag size={13} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Últimos pedidos</p>
                </div>
                {detailLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : custOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Nenhum pedido ainda</p>
                ) : (
                  <div className="space-y-2">
                    {custOrders.map(o => {
                      const st = STATUS_LABELS[o.status] || { label: o.status, color: "bg-gray-100 text-gray-600" };
                      return (
                        <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">R$ {fmtBRL(o.total_amount || 0)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Addresses */}
              {addresses.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={13} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endereços</p>
                  </div>
                  {addresses.map(addr => (
                    <div key={addr.id} className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 mb-2">
                      {addr.label && <p className="font-medium text-gray-700 mb-0.5">{addr.label}</p>}
                      <p>{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ""}</p>
                      <p>{addr.neighborhood} — {addr.city}/{addr.state}</p>
                      <p className="text-gray-400">CEP {addr.cep}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-5 py-3 border-t border-gray-50">
                <p className="text-xs text-gray-400">
                  Cadastrado em {new Date(selected.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <Users size={36} className="mx-auto mb-3" />
              <p className="text-sm">Clique em um cliente para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
