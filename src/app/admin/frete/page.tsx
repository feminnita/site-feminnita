"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save, Truck, Package, MapPin, Tag, Clock, CheckCircle,
  XCircle, RefreshCw, ExternalLink, Download, AlertCircle,
} from "lucide-react";

interface ShipOrder {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  shipping_address: any;
  shipping_service: string | null;
  total_amount: number;
  label_url: string | null;
  me_order_id: string | null;
  tracking_code: string | null;
  status: string;
}

type Tab = "pendentes" | "etiquetados" | "config" | "teste";

const SERVICE_NAMES: Record<string, string> = {
  "1": "PAC", "2": "SEDEX", "3": "SEDEX 10", "4": "SEDEX Hoje",
  "7": "Jadlog .Package", "8": "Jadlog .Com",
  pac: "PAC", sedex: "SEDEX", jadlog: "Jadlog .Package",
};

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function FretePage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("pendentes");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [pending, setPending] = useState<ShipOrder[]>([]);
  const [labeled, setLabeled] = useState<ShipOrder[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [labelResults, setLabelResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

  // Config state
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Test state
  const [testCep, setTestCep] = useState("");
  const [testResult, setTestResult] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, created_at, customer_name, shipping_address, shipping_service, total_amount, label_url, me_order_id, tracking_code, status")
      .in("status", ["paid", "confirmed", "processing", "shipped", "label_generated"])
      .order("created_at", { ascending: false });

    const orders = (data || []) as ShipOrder[];
    setPending(orders.filter(o => !o.label_url && !o.me_order_id));
    setLabeled(orders.filter(o => o.label_url || o.me_order_id));
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    loadOrders();
    // Load settings
    supabase.from("site_settings").select("key, value").then(({ data }) => {
      if (data) {
        const map: any = {};
        data.forEach((r: any) => {
          try { map[r.key] = typeof r.value === "string" ? r.value.replace(/^"|"$/g, "") : String(r.value); }
          catch { map[r.key] = ""; }
        });
        setSettings(map);
      }
    });
  }, [loadOrders]);

  const generateLabel = async (orderId: string) => {
    setGenerating(orderId);
    try {
      const res = await fetch("/api/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.labelUrl) {
        setLabelResults(p => ({ ...p, [orderId]: { ok: true, msg: "Etiqueta gerada!" } }));
        loadOrders();
      } else {
        setLabelResults(p => ({ ...p, [orderId]: { ok: false, msg: data.error || "Erro ao gerar etiqueta" } }));
      }
    } catch (e: any) {
      setLabelResults(p => ({ ...p, [orderId]: { ok: false, msg: e.message } }));
    }
    setGenerating(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const keys = ["melhor_envio_token", "store_cep", "free_shipping_threshold", "melhor_envio_sandbox"];
    await supabase.from("site_settings").upsert(
      keys.map(key => ({ key, value: JSON.stringify(settings[key] || ""), updated_at: new Date().toISOString() })),
      { onConflict: "key" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testShipping = async () => {
    if (testCep.replace(/\D/g, "").length < 8) return;
    setTesting(true);
    setTestResult([]);
    const res = await fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep: testCep, products: [{ weight: 0.5, quantity: 1 }] }),
    });
    const data = await res.json();
    setTestResult(data.options || []);
    setTesting(false);
  };

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "pendentes",   label: "Aguardando etiqueta", count: pending.length },
    { id: "etiquetados", label: "Com etiqueta",        count: labeled.length },
    { id: "config",      label: "Configurações" },
    { id: "teste",       label: "Testar frete" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Frete e Etiquetas</h1>
          <p className="text-gray-500 mt-1">Melhor Envio — geração de etiquetas e cálculo de frete</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://melhorenvio.com.br/painel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#009C45] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#007d37]"
          >
            <ExternalLink size={14} /> Painel ME
          </a>
          <button onClick={loadOrders} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw size={15} className={loadingOrders ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
            <Clock size={18} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
            <p className="text-sm text-gray-500">Aguardando etiqueta</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Tag size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{labeled.length}</p>
            <p className="text-sm text-gray-500">Etiquetas geradas</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Truck size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{labeled.filter(o => o.tracking_code).length}</p>
            <p className="text-sm text-gray-500">Com rastreio</p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? "text-[#8C2F39] border-b-2 border-[#8C2F39]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  tab === t.id ? "bg-[#8C2F39] text-white" : "bg-gray-100 text-gray-500"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── PENDENTES ── */}
          {tab === "pendentes" && (
            loadingOrders ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <RefreshCw size={20} className="animate-spin mr-2" /> Carregando...
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-14">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
                <p className="text-gray-600 font-medium">Tudo em dia!</p>
                <p className="text-gray-400 text-sm mt-1">Nenhum pedido aguardando etiqueta</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">{pending.length} pedido{pending.length !== 1 ? "s" : ""} sem etiqueta</p>
                  {pending.length > 1 && (
                    <button
                      onClick={async () => { for (const o of pending) await generateLabel(o.id); }}
                      disabled={!!generating}
                      className="text-sm text-[#8C2F39] font-medium hover:underline disabled:opacity-50"
                    >
                      Gerar todas ({pending.length})
                    </button>
                  )}
                </div>
                {pending.map(order => {
                  const addr = (order.shipping_address as any) || {};
                  const res = labelResults[order.id];
                  return (
                    <div key={order.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Package size={16} className="text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 text-sm">{order.customer_name}</span>
                          <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {addr.street}{addr.number ? `, ${addr.number}` : ""} — {addr.city}/{addr.state} · {addr.cep}
                        </p>
                        {order.shipping_service && (
                          <p className="text-xs text-blue-600 mt-0.5">
                            {SERVICE_NAMES[order.shipping_service] || order.shipping_service}
                          </p>
                        )}
                        {res && (
                          <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${res.ok ? "text-green-600" : "text-red-500"}`}>
                            {res.ok ? <CheckCircle size={12} /> : <XCircle size={12} />} {res.msg}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-gray-700">R$ {fmtBRL(order.total_amount || 0)}</span>
                        <button
                          onClick={() => generateLabel(order.id)}
                          disabled={generating === order.id}
                          className="flex items-center gap-1.5 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {generating === order.id
                            ? <><RefreshCw size={12} className="animate-spin" /> Gerando...</>
                            : <><Tag size={12} /> Gerar etiqueta</>
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── ETIQUETADOS ── */}
          {tab === "etiquetados" && (
            labeled.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <Tag size={36} className="mx-auto mb-3" />
                <p>Nenhuma etiqueta gerada ainda</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-500">
                      <th className="text-left px-4 py-2.5">Cliente</th>
                      <th className="text-left px-4 py-2.5">Data</th>
                      <th className="text-left px-4 py-2.5">Serviço</th>
                      <th className="text-left px-4 py-2.5">Rastreio</th>
                      <th className="text-right px-4 py-2.5">Etiqueta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {labeled.map(order => {
                      const addr = (order.shipping_address as any) || {};
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{order.customer_name}</p>
                            <p className="text-xs text-gray-400">{addr.city}/{addr.state}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {order.shipping_service ? (SERVICE_NAMES[order.shipping_service] || order.shipping_service) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {order.tracking_code ? (
                              <a
                                href={`https://rastreamento.correios.com.br/app/index.php?objetos=${order.tracking_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-mono text-xs"
                              >
                                {order.tracking_code}
                              </a>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {order.label_url ? (
                              <a
                                href={order.label_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                              >
                                <Download size={12} /> Imprimir
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                <AlertCircle size={12} /> Sem PDF
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── CONFIG ── */}
          {tab === "config" && (
            <div className="max-w-xl space-y-6">
              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Melhor Envio</label>
                <p className="text-xs text-gray-400 mb-2">melhorenvio.com.br → Tokens de acesso</p>
                <input
                  type="text"
                  value={settings.melhor_envio_token || ""}
                  onChange={e => setSettings({ ...settings, melhor_envio_token: e.target.value })}
                  placeholder="eyJ0eXAiOiJKV1Qi..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8C2F39]"
                />
              </div>

              {/* CEP origem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP de origem</label>
                <p className="text-xs text-gray-400 mb-2">CEP do local onde os pedidos são postados</p>
                <input
                  type="text"
                  value={settings.store_cep || ""}
                  onChange={e => setSettings({ ...settings, store_cep: e.target.value.replace(/\D/g, "") })}
                  placeholder="28600000"
                  maxLength={8}
                  className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8C2F39]"
                />
              </div>

              {/* Frete grátis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frete grátis acima de (R$)</label>
                <p className="text-xs text-gray-400 mb-2">Deixe 0 para desativar</p>
                <input
                  type="number"
                  value={settings.free_shipping_threshold || ""}
                  onChange={e => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                  placeholder="299"
                  className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8C2F39]"
                />
              </div>

              {/* Sandbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sandbox"
                  checked={settings.melhor_envio_sandbox === "true"}
                  onChange={e => setSettings({ ...settings, melhor_envio_sandbox: e.target.checked ? "true" : "false" })}
                  className="w-4 h-4 accent-[#8C2F39]"
                />
                <label htmlFor="sandbox" className="text-sm text-gray-700">
                  Ambiente sandbox (testes) — desmarque para produção
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#7a2832] disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar configurações"}
              </button>
            </div>
          )}

          {/* ── TESTE ── */}
          {tab === "teste" && (
            <div className="max-w-sm">
              <h3 className="font-semibold text-gray-700 mb-4">Simular cotação de frete</h3>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={testCep}
                  onChange={e => setTestCep(e.target.value.replace(/\D/g, ""))}
                  placeholder="CEP de destino"
                  maxLength={8}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8C2F39]"
                />
                <button
                  onClick={testShipping}
                  disabled={testing || testCep.length < 8}
                  className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  {testing ? "..." : "Calcular"}
                </button>
              </div>
              {testResult.length > 0 && (
                <div className="space-y-2">
                  {testResult.map((opt: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Truck size={16} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-sm text-gray-800">{opt.name}</p>
                          <p className="text-xs text-gray-400">{opt.company} · {opt.delivery_time}</p>
                        </div>
                      </div>
                      <p className="font-bold text-[#8C2F39]">
                        {opt.price === 0 ? "Grátis" : `R$ ${fmtBRL(opt.price)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
