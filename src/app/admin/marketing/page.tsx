"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save, Instagram, Tag, Globe, MessageCircle, BarChart3,
  Megaphone, Layers, GripVertical, Eye, EyeOff, X,
} from "lucide-react";

type Settings = { [key: string]: string };
type Tab = "secoes" | "pixels" | "seo" | "social";

interface HomeSection {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_SECTIONS: HomeSection[] = [
  { id: "hero",        label: "Carrossel principal",     visible: true },
  { id: "categorias",  label: "Categorias em destaque",  visible: true },
  { id: "novidades",   label: "Novidades",               visible: true },
  { id: "bestsellers", label: "Mais vendidos",           visible: true },
  { id: "lookbook",    label: "Lookbook",                visible: true },
  { id: "blog",        label: "Blog / Dicas",            visible: true },
  { id: "newsletter",  label: "Newsletter",              visible: true },
];

const SETTING_FIELDS = [
  {
    tab: "pixels" as Tab,
    section: "Pixels & Rastreamento",
    items: [
      { key: "fb_pixel_id",           label: "Facebook Pixel ID",          placeholder: "123456789012345" },
      { key: "google_analytics_id",   label: "Google Analytics 4 (ID)",    placeholder: "G-XXXXXXXXXX" },
      { key: "google_tag_manager_id", label: "Google Tag Manager (ID)",     placeholder: "GTM-XXXXXXX" },
      { key: "tiktok_pixel_id",       label: "TikTok Pixel ID",            placeholder: "XXXXXXXXXXXXXXXXXX" },
      { key: "google_ads_id",         label: "Google Ads (Conversion ID)", placeholder: "AW-XXXXXXXXX" },
    ],
  },
  {
    tab: "seo" as Tab,
    section: "SEO",
    items: [
      { key: "meta_title",                  label: "Título padrão do site",         placeholder: "Feminnita | Moda Fitness Feminina" },
      { key: "meta_description",            label: "Descrição padrão",              placeholder: "Moda fitness feminina com design exclusivo..." },
      { key: "meta_keywords",               label: "Palavras-chave",                placeholder: "moda fitness, legging, top fitness" },
      { key: "facebook_domain_verification",label: "Verificação Facebook",          placeholder: "xxxxxxxxxxxxxxxxxx" },
      { key: "google_site_verification",    label: "Verificação Google",            placeholder: "xxxxxxxxxxxxxxxxxx" },
    ],
  },
  {
    tab: "social" as Tab,
    section: "Redes Sociais",
    items: [
      { key: "instagram_handle",   label: "Instagram",        placeholder: "@feminnita" },
      { key: "facebook_page_url",  label: "Facebook (URL)",   placeholder: "https://facebook.com/feminnita" },
      { key: "youtube_channel_url",label: "YouTube (URL)",    placeholder: "https://youtube.com/@feminnita" },
      { key: "tiktok_handle",      label: "TikTok",           placeholder: "@feminnita" },
      { key: "whatsapp_number",    label: "WhatsApp (DDD+número)", placeholder: "5522999999999", help: "Só números, ex: 5522999999999" },
      { key: "whatsapp_chat_message", label: "Mensagem padrão WhatsApp", placeholder: "Olá! Quero saber mais sobre os produtos." },
    ],
  },
];

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "secoes", label: "Seções da loja",    icon: <Layers size={15} /> },
  { id: "pixels", label: "Pixels",             icon: <Tag size={15} /> },
  { id: "seo",    label: "SEO",                icon: <Globe size={15} /> },
  { id: "social", label: "Redes Sociais",      icon: <Instagram size={15} /> },
];

export default function MarketingPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("secoes");
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sections state
  const [sections, setSections] = useState<HomeSection[]>(DEFAULT_SECTIONS);
  const [annBar, setAnnBar] = useState({ enabled: false, text: "", bg: "#8C2F39", link: "" });
  const [popup, setPopup] = useState({ enabled: false, title: "", subtitle: "", code: "", delay: 5, btn: "Pegar desconto" });
  const dragId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("site_settings").select("key, value").then(({ data }) => {
      if (!data) return;
      const map: Settings = {};
      data.forEach((r: any) => {
        try { map[r.key] = typeof r.value === "string" ? r.value.replace(/^"|"$/g, "") : String(r.value); }
        catch { map[r.key] = ""; }
      });
      setSettings(map);

      // Load sections config
      if (map.home_sections) {
        try { setSections(JSON.parse(map.home_sections)); } catch {}
      }
      if (map.announcement_bar) {
        try { setAnnBar(JSON.parse(map.announcement_bar)); } catch {}
      }
      if (map.discount_popup) {
        try { setPopup(JSON.parse(map.discount_popup)); } catch {}
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const allKeys = SETTING_FIELDS.flatMap(s => s.items.map(i => i.key));
    const upserts = [
      ...allKeys.map(key => ({ key, value: JSON.stringify(settings[key] || ""), updated_at: new Date().toISOString() })),
      { key: "home_sections",   value: JSON.stringify(sections),  updated_at: new Date().toISOString() },
      { key: "announcement_bar",value: JSON.stringify(annBar),    updated_at: new Date().toISOString() },
      { key: "discount_popup",  value: JSON.stringify(popup),     updated_at: new Date().toISOString() },
    ];
    await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Drag reorder for sections
  const onDrop = (targetId: string) => {
    setDragOver(null);
    if (!dragId.current || dragId.current === targetId) return;
    const arr = [...sections];
    const fi = arr.findIndex(s => s.id === dragId.current);
    const ti = arr.findIndex(s => s.id === targetId);
    const [moved] = arr.splice(fi, 1);
    arr.splice(ti, 0, moved);
    setSections(arr);
    dragId.current = null;
  };

  const currentFields = SETTING_FIELDS.find(s => s.tab === tab);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-500 mt-1">Seções da loja, pixels, SEO e redes sociais</p>
        </div>
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#7a2832] disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar tudo"}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? "text-[#8C2F39] border-b-2 border-[#8C2F39]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── SEÇÕES DA LOJA ── */}
          {tab === "secoes" && (
            <div className="space-y-6">

              {/* Barra de anúncio */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Megaphone size={15} className="text-gray-500" />
                    <h3 className="font-semibold text-gray-700 text-sm">Barra de anúncio</h3>
                  </div>
                  <button
                    onClick={() => setAnnBar(a => ({ ...a, enabled: !a.enabled }))}
                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${
                      annBar.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {annBar.enabled ? <><Eye size={11} /> Ativa</> : <><EyeOff size={11} /> Inativa</>}
                  </button>
                </div>
                <div className="p-5 grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Texto do anúncio</label>
                    <input
                      type="text" value={annBar.text}
                      onChange={e => setAnnBar(a => ({ ...a, text: e.target.value }))}
                      placeholder="🚚 Frete grátis acima de R$ 299 | Use o cupom BEMVINDA10"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Link (opcional)</label>
                    <input
                      type="text" value={annBar.link}
                      onChange={e => setAnnBar(a => ({ ...a, link: e.target.value }))}
                      placeholder="/colecao/novidades"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cor de fundo</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={annBar.bg} onChange={e => setAnnBar(a => ({ ...a, bg: e.target.value }))}
                        className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5" />
                      <span className="text-sm text-gray-500 font-mono">{annBar.bg}</span>
                      <div className="flex-1 h-8 rounded-lg" style={{ background: annBar.bg }} />
                    </div>
                  </div>
                </div>
                {annBar.text && (
                  <div className="mx-5 mb-5 rounded-lg py-2 px-4 text-center text-white text-sm" style={{ background: annBar.bg }}>
                    {annBar.text}
                  </div>
                )}
              </div>

              {/* Popup de desconto */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Tag size={15} className="text-gray-500" />
                    <h3 className="font-semibold text-gray-700 text-sm">Popup de desconto</h3>
                  </div>
                  <button
                    onClick={() => setPopup(p => ({ ...p, enabled: !p.enabled }))}
                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${
                      popup.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {popup.enabled ? <><Eye size={11} /> Ativo</> : <><EyeOff size={11} /> Inativo</>}
                  </button>
                </div>
                <div className="p-5 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
                    <input type="text" value={popup.title}
                      onChange={e => setPopup(p => ({ ...p, title: e.target.value }))}
                      placeholder="Ganhe 10% de desconto!"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subtítulo</label>
                    <input type="text" value={popup.subtitle}
                      onChange={e => setPopup(p => ({ ...p, subtitle: e.target.value }))}
                      placeholder="Cadastre seu e-mail e receba o cupom"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Código do cupom</label>
                    <input type="text" value={popup.code}
                      onChange={e => setPopup(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      placeholder="BEMVINDA10"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#8C2F39]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Texto do botão</label>
                    <input type="text" value={popup.btn}
                      onChange={e => setPopup(p => ({ ...p, btn: e.target.value }))}
                      placeholder="Quero meu desconto!"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aparece após (segundos)</label>
                    <input type="number" min="0" max="60" value={popup.delay}
                      onChange={e => setPopup(p => ({ ...p, delay: parseInt(e.target.value) || 0 }))}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]" />
                  </div>
                </div>
              </div>

              {/* Homepage sections order */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                  <Layers size={15} className="text-gray-500" />
                  <h3 className="font-semibold text-gray-700 text-sm">Seções da homepage</h3>
                  <span className="text-xs text-gray-400 ml-1">· arraste para reordenar</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {sections.map(sec => (
                    <div
                      key={sec.id}
                      draggable
                      onDragStart={() => { dragId.current = sec.id; }}
                      onDragOver={e => { e.preventDefault(); setDragOver(sec.id); }}
                      onDrop={() => onDrop(sec.id)}
                      onDragEnd={() => setDragOver(null)}
                      className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${dragOver === sec.id ? "bg-rose-50 border-l-2 border-[#8C2F39]" : ""}`}
                    >
                      <GripVertical size={16} className="text-gray-300 cursor-grab shrink-0" />
                      <span className={`flex-1 text-sm ${sec.visible ? "text-gray-800 font-medium" : "text-gray-400 line-through"}`}>
                        {sec.label}
                      </span>
                      <button
                        onClick={() => setSections(prev => prev.map(s => s.id === sec.id ? { ...s, visible: !s.visible } : s))}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          sec.visible ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {sec.visible ? <><Eye size={11} /> Visível</> : <><EyeOff size={11} /> Oculta</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PIXELS / SEO / SOCIAL ── */}
          {currentFields && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">{currentFields.section}</h3>
              {currentFields.items.map(item => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                  {"help" in item && item.help && <p className="text-xs text-gray-400 mb-1">{item.help}</p>}
                  <input
                    type="text"
                    value={settings[item.key] || ""}
                    onChange={e => setSettings({ ...settings, [item.key]: e.target.value })}
                    placeholder={item.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8C2F39]"
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
