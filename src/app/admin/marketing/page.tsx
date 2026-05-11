"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Facebook, Instagram, Youtube, MessageCircle, BarChart3, Tag, Globe } from "lucide-react";

type Settings = { [key: string]: string };

const fields = [
  {
    section: "Redes Sociais",
    icon: <Instagram size={20} />,
    items: [
      { key: "instagram_handle", label: "Instagram (usuário)", placeholder: "@feminnita", help: "Exibido no rodapé e links do site" },
      { key: "facebook_page_url", label: "Facebook (URL da página)", placeholder: "https://facebook.com/feminnita" },
      { key: "youtube_channel_url", label: "YouTube (URL do canal)", placeholder: "https://youtube.com/@feminnita" },
      { key: "whatsapp_number", label: "WhatsApp (com DDD)", placeholder: "5522999999999", help: "Só números, ex: 5522999999999" },
      { key: "tiktok_handle", label: "TikTok (usuário)", placeholder: "@feminnita" },
    ],
  },
  {
    section: "Pixels & Rastreamento",
    icon: <Tag size={20} />,
    items: [
      { key: "fb_pixel_id", label: "Facebook Pixel ID", placeholder: "123456789012345", help: "Encontrado no Gerenciador de Eventos do Facebook" },
      { key: "google_analytics_id", label: "Google Analytics 4 (ID)", placeholder: "G-XXXXXXXXXX" },
      { key: "google_tag_manager_id", label: "Google Tag Manager (ID)", placeholder: "GTM-XXXXXXX" },
      { key: "tiktok_pixel_id", label: "TikTok Pixel ID", placeholder: "XXXXXXXXXXXXXXXXXX" },
      { key: "google_ads_id", label: "Google Ads (Conversion ID)", placeholder: "AW-XXXXXXXXX" },
    ],
  },
  {
    section: "SEO",
    icon: <Globe size={20} />,
    items: [
      { key: "meta_title", label: "Título padrão do site", placeholder: "Feminnita | Moda Fitness Feminina" },
      { key: "meta_description", label: "Descrição padrão", placeholder: "Moda fitness feminina com design exclusivo..." },
      { key: "meta_keywords", label: "Palavras-chave", placeholder: "moda fitness, legging, top fitness" },
      { key: "facebook_domain_verification", label: "Verificação de domínio (Facebook)", placeholder: "xxxxxxxxxxxxxxxxxx" },
      { key: "google_site_verification", label: "Verificação de domínio (Google)", placeholder: "xxxxxxxxxxxxxxxxxx" },
    ],
  },
  {
    section: "E-mail Marketing",
    icon: <BarChart3 size={20} />,
    items: [
      { key: "resend_api_key", label: "Resend API Key", placeholder: "re_xxxxxxxxxxxxxxxx", help: "Usado para envio de e-mails transacionais" },
      { key: "email_from_name", label: "Nome do remetente", placeholder: "Feminnita" },
      { key: "email_from_address", label: "E-mail remetente", placeholder: "contato@feminnita.com.br" },
    ],
  },
  {
    section: "WhatsApp & Chat",
    icon: <MessageCircle size={20} />,
    items: [
      { key: "whatsapp_chat_message", label: "Mensagem padrão do botão WhatsApp", placeholder: "Olá! Vim pelo site e quero saber mais sobre os produtos." },
      { key: "whatsapp_chat_enabled", label: "Exibir botão WhatsApp no site", placeholder: "true" },
    ],
  },
];

export default function AdminMarketingPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const map: Settings = {};
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
    const allKeys = fields.flatMap(s => s.items.map(i => i.key));
    const upserts = allKeys.map(key => ({
      key,
      value: JSON.stringify(settings[key] || ""),
      updated_at: new Date().toISOString(),
    }));
    await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Marketing & Integrações</h1>
          <p className="text-gray-500 mt-1">Configure pixels, redes sociais, SEO e e-mail marketing</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-3 rounded-lg hover:bg-[#7a2832] transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar tudo"}
        </button>
      </div>

      <div className="space-y-8">
        {fields.map((section) => (
          <div key={section.section} className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b">
              <span className="text-[#8C2F39]">{section.icon}</span>
              <h2 className="font-semibold text-lg">{section.section}</h2>
            </div>
            <div className="grid gap-4">
              {section.items.map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {item.label}
                  </label>
                  {item.help && <p className="text-xs text-gray-400 mb-1">{item.help}</p>}
                  <input
                    type="text"
                    value={settings[item.key] || ""}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                    placeholder={item.placeholder}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39] focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
