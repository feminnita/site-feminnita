"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Search, Filter, Package, Eye, Truck, CheckCircle, Clock, XCircle,
  ChevronDown, Copy, MessageCircle, Printer, X, ExternalLink,
} from "lucide-react";

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  installments: number | null;
  asaas_payment_id: string | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_method: string | null;
  shipping_address: any;
  tracking_code: string | null;
  tracking_url: string | null;
  label_url: string | null;
  notes: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf: string | null;
  items: OrderItem[];
};

const STATUS = {
  pending:    { label: "Pendente",     color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed:  { label: "Confirmado",   color: "bg-blue-100 text-blue-800",     icon: CheckCircle },
  paid:       { label: "Pago",         color: "bg-green-100 text-green-800",   icon: CheckCircle },
  processing: { label: "Processando",  color: "bg-blue-100 text-blue-800",     icon: Clock },
  shipped:    { label: "Enviado",      color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered:  { label: "Entregue",     color: "bg-purple-100 text-purple-800", icon: Package },
  cancelled:  { label: "Cancelado",    color: "bg-red-100 text-red-800",       icon: XCircle },
  overdue:    { label: "Vencido",      color: "bg-orange-100 text-orange-800", icon: Clock },
  refunded:   { label: "Reembolsado",  color: "bg-gray-100 text-gray-700",     icon: XCircle },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto Bancário",
  credit_card: "Cartão de Crédito",
};

const TIMELINE_STEPS = [
  { key: "created",   label: "Pedido realizado" },
  { key: "paid",      label: "Pagamento confirmado" },
  { key: "shipped",   label: "Aguardando envio" },
  { key: "delivered", label: "Previsão de entrega" },
];

function timelineStep(status: string) {
  if (["cancelled", "refunded", "overdue"].includes(status)) return 0;
  if (["pending"].includes(status)) return 1;
  if (["confirmed", "paid", "processing"].includes(status)) return 2;
  if (["shipped"].includes(status)) return 3;
  if (["delivered"].includes(status)) return 4;
  return 1;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingInput, setTrackingInput] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .order("created_at", { ascending: false });
    setOrders((data || []) as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const match =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q) ||
      (o.tracking_code || "").toLowerCase().includes(q);
    const st = statusFilter === "all" || o.status === statusFilter;
    return match && st;
  });

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected((p) => p ? { ...p, status } : p);
  };

  const saveTracking = async () => {
    if (!selected || !trackingInput.trim()) return;
    setSavingTracking(true);
    const code = trackingInput.trim().toUpperCase();
    await supabase
      .from("orders")
      .update({ tracking_code: code, status: "shipped" })
      .eq("id", selected.id);
    setOrders((prev) =>
      prev.map((o) => o.id === selected.id ? { ...o, tracking_code: code, status: "shipped" } : o)
    );
    setSelected((p) => p ? { ...p, tracking_code: code, status: "shipped" } : p);
    setSavingTracking(false);
  };

  const totalRevenue = orders
    .filter((o) => !["cancelled", "refunded"].includes(o.status))
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">{orders.length} pedidos no total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Total de pedidos</p>
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
            {orders.filter((o) => ["paid", "confirmed"].includes(o.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Receita total</p>
          <p className="text-xl font-bold text-[#8C2F39]">R$ {fmtBRL(totalRevenue)}</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pedido, cliente, rastreio..."
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
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>

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
                  const cfg = STATUS[order.status as keyof typeof STATUS] || STATUS.pending;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={order.id}
                      onClick={() => { setSelected(order); setTrackingInput(order.tracking_code || ""); }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selected?.id === order.id ? "bg-rose-50 border-l-4 border-[#8C2F39]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-gray-900">#{order.order_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                              <Icon size={11} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 truncate">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleString("pt-BR")}
                          </p>
                          {order.tracking_code && (
                            <p className="text-xs text-indigo-500 mt-0.5">📦 {order.tracking_code}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900">R$ {fmtBRL(order.total)}</p>
                          <p className="text-xs text-gray-400">{order.items?.length || 0} item(s)</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-96 shrink-0">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm sticky top-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="font-bold text-lg">Pedido #{selected.order_number}</h3>
                  <p className="text-xs text-gray-400">
                    {new Date(selected.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg border hover:bg-gray-50"
                    title="Imprimir"
                  >
                    <Printer size={15} className="text-gray-500" />
                  </button>
                  <button onClick={() => setSelected(null)} className="p-2 rounded-lg border hover:bg-gray-50">
                    <X size={15} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-220px)] p-6 space-y-5">
                {/* Timeline */}
                <div>
                  <div className="flex items-center justify-between">
                    {TIMELINE_STEPS.map((step, i) => {
                      const step_n = i + 1;
                      const current = timelineStep(selected.status);
                      const done = current >= step_n;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative">
                          {i < TIMELINE_STEPS.length - 1 && (
                            <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done && current > step_n ? "bg-[#8C2F39]" : "bg-gray-200"}`} />
                          )}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                            done ? "bg-[#8C2F39] text-white" : "bg-gray-200 text-gray-400"
                          }`}>
                            {done ? "✓" : step_n}
                          </div>
                          <p className="text-[10px] text-center text-gray-500 mt-1 leading-tight">{step.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status do pedido</p>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected.id, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#8C2F39]"
                  >
                    {Object.entries(STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Customer */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Cliente</p>
                  <p className="font-semibold text-sm">{selected.customer_name}</p>
                  <p className="text-xs text-gray-500">{selected.customer_email}</p>
                  {selected.customer_cpf && (
                    <p className="text-xs text-gray-500">CPF: {selected.customer_cpf}</p>
                  )}
                  {selected.customer_phone && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-gray-500">{selected.customer_phone}</p>
                      <a
                        href={`https://wa.me/55${selected.customer_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-lg hover:bg-green-600"
                      >
                        <MessageCircle size={11} />
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Items */}
                {selected.items?.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                      Produtos ({selected.items.length})
                    </p>
                    <div className="space-y-3">
                      {selected.items.map((item, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            {item.product_image ? (
                              <Image
                                src={item.product_image}
                                alt={item.product_name}
                                width={48}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={16} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-2">{item.product_name}</p>
                            <div className="flex flex-wrap gap-x-2 mt-0.5">
                              {item.color && <p className="text-xs text-gray-400">Cor: {item.color}</p>}
                              {item.size && <p className="text-xs text-gray-400">Tam: {item.size}</p>}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">{item.quantity}× R$ {fmtBRL(item.unit_price)}</p>
                              <p className="text-xs font-bold">R$ {fmtBRL(item.total_price)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t pt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R$ {fmtBRL(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frete {selected.shipping_method ? `(${selected.shipping_method})` : ""}</span>
                    <span>R$ {fmtBRL(selected.shipping_cost)}</span>
                  </div>
                  {selected.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>- R$ {fmtBRL(selected.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#8C2F39]">R$ {fmtBRL(selected.total)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Pagamento</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Forma</span>
                      <span className="font-medium">{PAYMENT_LABELS[selected.payment_method || ""] || selected.payment_method || "—"}</span>
                    </div>
                    {selected.installments && selected.installments > 1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Parcelas</span>
                        <span className="font-medium">{selected.installments}× de R$ {fmtBRL(selected.total / selected.installments)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${selected.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                        {selected.payment_status === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </div>
                    {selected.asaas_payment_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transação</span>
                        <span className="font-mono text-gray-600 truncate max-w-[140px]">{selected.asaas_payment_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping address */}
                {selected.shipping_address && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Endereço de entrega</p>
                      <button
                        onClick={() => {
                          const a = selected.shipping_address;
                          copyToClipboard(`${a.street}, ${a.number}${a.complement ? `, ${a.complement}` : ""} - ${a.neighborhood}, ${a.city}/${a.state} - CEP ${a.cep}`);
                        }}
                        className="flex items-center gap-1 text-xs text-[#8C2F39] hover:underline"
                      >
                        <Copy size={11} /> Copiar
                      </button>
                    </div>
                    {(() => {
                      const a = selected.shipping_address;
                      return (
                        <p className="text-xs text-gray-600 leading-5">
                          {a.street}, {a.number}{a.complement ? `, ${a.complement}` : ""}<br />
                          {a.neighborhood} — {a.city}/{a.state}<br />
                          CEP: {a.cep}
                        </p>
                      );
                    })()}
                  </div>
                )}

                {/* Tracking */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Código de rastreio</p>
                  {selected.tracking_code ? (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-mono text-sm bg-gray-50 border rounded-lg px-3 py-2">
                        {selected.tracking_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selected.tracking_code!)}
                        className="p-2 border rounded-lg hover:bg-gray-50"
                      >
                        <Copy size={13} className="text-gray-400" />
                      </button>
                      {selected.tracking_url && (
                        <a href={selected.tracking_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 border rounded-lg hover:bg-gray-50">
                          <ExternalLink size={13} className="text-gray-400" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                        placeholder="Ex: BR123456789BR"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#8C2F39]"
                      />
                      <button
                        onClick={saveTracking}
                        disabled={savingTracking || !trackingInput.trim()}
                        className="px-3 py-2 bg-[#8C2F39] text-white text-sm rounded-lg hover:bg-[#7a2832] disabled:opacity-50"
                      >
                        {savingTracking ? "..." : "Salvar"}
                      </button>
                    </div>
                  )}
                  {selected.label_url && (
                    <a
                      href={selected.label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                    >
                      <Printer size={12} /> Imprimir etiqueta
                    </a>
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
