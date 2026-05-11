"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Settings, Store, Truck, Percent, RefreshCw } from "lucide-react";

type SiteSettings = {
  store_name: string;
  store_phone: string;
  store_email: string;
  store_address: { street: string; city: string; state: string; cep: string };
  store_instagram: string;
  announcement_bar: string;
  free_shipping_threshold: number;
  pix_discount_percentage: number;
};

const defaults: SiteSettings = {
  store_name: "Feminnita",
  store_phone: "",
  store_email: "",
  store_address: { street: "", city: "", state: "", cep: "" },
  store_instagram: "",
  announcement_bar: "",
  free_shipping_threshold: 299,
  pix_discount_percentage: 10,
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((row: any) => { map[row.key] = row.value; });
      setSettings({
        store_name: map.store_name ?? defaults.store_name,
        store_phone: map.store_phone ?? defaults.store_phone,
        store_email: map.store_email ?? defaults.store_email,
        store_address: map.store_address ?? defaults.store_address,
        store_instagram: map.store_instagram ?? defaults.store_instagram,
        announcement_bar: map.announcement_bar ?? defaults.announcement_bar,
        free_shipping_threshold: Number(map.free_shipping_threshold) || defaults.free_shipping_threshold,
        pix_discount_percentage: Number(map.pix_discount_percentage) || defaults.pix_discount_percentage,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);

    const entries = [
      { key: "store_name", value: settings.store_name },
      { key: "store_phone", value: settings.store_phone },
      { key: "store_email", value: settings.store_email },
      { key: "store_address", value: settings.store_address },
      { key: "store_instagram", value: settings.store_instagram },
      { key: "announcement_bar", value: settings.announcement_bar },
      { key: "free_shipping_threshold", value: settings.free_shipping_threshold },
      { key: "pix_discount_percentage", value: settings.pix_discount_percentage },
    ];

    for (const entry of entries) {
      await supabase
        .from("site_settings")
        .upsert({ key: entry.key, value: entry.value }, { onConflict: "key" });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const set = (key: keyof SiteSettings, value: any) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const setAddress = (key: keyof SiteSettings["store_address"], value: string) =>
    setSettings((prev) => ({
      ...prev,
      store_address: { ...prev.store_address, [key]: value },
    }));

  if (loading) {
    return (
      <div className="p-8 flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 mt-1">Configurações gerais da loja</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#7a2832] disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar tudo"}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800 font-medium text-sm">
          ✅ Configurações salvas com sucesso!
        </div>
      )}

      <div className="space-y-6">
        {/* Store info */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Store size={20} className="text-[#8C2F39]" />
            <h2 className="text-lg font-bold">Informações da Loja</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => set("store_name", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={settings.store_phone}
                onChange={(e) => set("store_phone", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                placeholder="+55 21 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={settings.store_email}
                onChange={(e) => set("store_email", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                placeholder="contato@feminnita.com.br"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input
                type="text"
                value={settings.store_instagram}
                onChange={(e) => set("store_instagram", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                placeholder="@feminnita"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={20} className="text-[#8C2F39]" />
            <h2 className="text-lg font-bold">Endereço da Loja</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
              <input
                type="text"
                value={settings.store_address.street}
                onChange={(e) => setAddress("street", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={settings.store_address.city}
                onChange={(e) => setAddress("city", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                type="text"
                value={settings.store_address.state}
                onChange={(e) => setAddress("state", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                placeholder="RJ"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                value={settings.store_address.cep}
                onChange={(e) => setAddress("cep", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                placeholder="28600-000"
              />
            </div>
          </div>
        </section>

        {/* Promotions */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Percent size={20} className="text-[#8C2F39]" />
            <h2 className="text-lg font-bold">Promoções e Frete</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desconto PIX (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.pix_discount_percentage}
                onChange={(e) => set("pix_discount_percentage", Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
              />
              <p className="text-xs text-gray-400 mt-1">Desconto aplicado em pagamentos via PIX</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frete grátis acima de (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.free_shipping_threshold}
                onChange={(e) => set("free_shipping_threshold", Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
              />
            </div>
          </div>
        </section>

        {/* Announcement bar */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Truck size={20} className="text-[#8C2F39]" />
            <h2 className="text-lg font-bold">Barra de Anúncio</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto da barra de anúncio (topo do site)
            </label>
            <input
              type="text"
              value={settings.announcement_bar}
              onChange={(e) => set("announcement_bar", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
              placeholder="10X SEM JUROS nos cartões de crédito"
            />
            <p className="text-xs text-gray-400 mt-1">
              Este texto aparece no topo do site para todos os visitantes
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
