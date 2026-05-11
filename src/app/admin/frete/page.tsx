"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Truck, Package, MapPin } from "lucide-react";

export default function AdminFretePage() {
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testCep, setTestCep] = useState("");
  const [testResult, setTestResult] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const map: any = {};
        data.forEach((r: any) => {
          try { map[r.key] = typeof r.value === "string" ? r.value.replace(/^"|"$/g, "") : String(r.value); }
          catch { map[r.key] = ""; }
        });
        setSettings(map);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const keys = ["melhor_envio_token", "store_cep", "free_shipping_threshold", "melhor_envio_sandbox"];
    const upserts = keys.map((key) => ({
      key,
      value: JSON.stringify(settings[key] || ""),
      updated_at: new Date().toISOString(),
    }));
    await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testShipping = async () => {
    if (!testCep || testCep.length < 8) return;
    setTesting(true);
    setTestResult([]);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: testCep, items: [{ weight: 0.5, width: 20, height: 5, length: 30, quantity: 1 }] }),
      });
      const data = await res.json();
      setTestResult(data.options || []);
    } catch {
      setTestResult([]);
    }
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Configurações de Frete</h1>
          <p className="text-gray-500 mt-1">Configure o Melhor Envio e regras de frete grátis</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-3 rounded-lg hover:bg-[#7a2832] transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Melhor Envio */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b">
          <Truck size={20} className="text-[#8C2F39]" />
          <h2 className="font-semibold text-lg">Melhor Envio</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token de acesso</label>
            <p className="text-xs text-gray-400 mb-1">Obtenha em melhorenvio.com.br → Tokens de acesso</p>
            <input
              type="text"
              value={settings.melhor_envio_token || ""}
              onChange={(e) => setSettings({ ...settings, melhor_envio_token: e.target.value })}
              placeholder="eyJ0eXAiOiJKV1QiLCJhbGc..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sandbox"
              checked={settings.melhor_envio_sandbox === "true"}
              onChange={(e) => setSettings({ ...settings, melhor_envio_sandbox: e.target.checked ? "true" : "false" })}
              className="w-4 h-4 accent-[#8C2F39]"
            />
            <label htmlFor="sandbox" className="text-sm text-gray-700">
              Usar ambiente de testes (sandbox) — desmarque para produção
            </label>
          </div>
        </div>
      </div>

      {/* CEP de origem */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b">
          <MapPin size={20} className="text-[#8C2F39]" />
          <h2 className="font-semibold text-lg">Endereço de origem</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEP de onde os pedidos são enviados</label>
          <input
            type="text"
            value={settings.store_cep || ""}
            onChange={(e) => setSettings({ ...settings, store_cep: e.target.value.replace(/\D/g, "") })}
            placeholder="28600000"
            maxLength={8}
            className="w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
          />
        </div>
      </div>

      {/* Frete grátis */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b">
          <Package size={20} className="text-[#8C2F39]" />
          <h2 className="font-semibold text-lg">Frete Grátis</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor mínimo para frete grátis (R$)</label>
          <p className="text-xs text-gray-400 mb-1">Digite 0 para desativar</p>
          <input
            type="number"
            value={settings.free_shipping_threshold || ""}
            onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
            placeholder="299"
            className="w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
          />
        </div>
      </div>

      {/* Teste de frete */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b">
          <Truck size={20} className="text-[#8C2F39]" />
          <h2 className="font-semibold text-lg">Testar cotação de frete</h2>
        </div>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={testCep}
            onChange={(e) => setTestCep(e.target.value.replace(/\D/g, ""))}
            placeholder="CEP de destino"
            maxLength={8}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
          />
          <button
            onClick={testShipping}
            disabled={testing || testCep.length < 8}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {testing ? "Calculando..." : "Calcular"}
          </button>
        </div>
        {testResult.length > 0 && (
          <div className="space-y-2">
            {testResult.map((opt: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{opt.name}</p>
                  <p className="text-xs text-gray-500">{opt.days} dias úteis</p>
                </div>
                <p className="font-semibold text-[#8C2F39]">
                  {opt.price === 0 ? "Grátis" : `R$ ${opt.price.toFixed(2).replace(".", ",")}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
