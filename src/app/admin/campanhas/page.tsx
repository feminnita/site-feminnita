"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Edit, Trash2, X, Save, Megaphone, Calendar,
  Tag, ToggleLeft, ToggleRight, Search, Package,
} from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  discount_pct: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
};

type Product = { id: string; name: string; code: string | null; images: string[] };

type CampaignForm = {
  name: string;
  slug: string;
  type: string;
  description: string;
  discount_pct: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  black_friday: "Black Friday",
  natal: "Natal",
  dia_das_maes: "Dia das Mães",
  dia_dos_pais: "Dia dos Pais",
  dia_dos_namorados: "Dia dos Namorados",
  liquidacao: "Liquidação",
  custom: "Personalizada",
};

const TYPE_COLORS: Record<string, string> = {
  black_friday: "bg-gray-900 text-white",
  natal: "bg-green-100 text-green-800",
  dia_das_maes: "bg-pink-100 text-pink-800",
  dia_dos_pais: "bg-blue-100 text-blue-800",
  dia_dos_namorados: "bg-red-100 text-red-800",
  liquidacao: "bg-orange-100 text-orange-800",
  custom: "bg-purple-100 text-purple-800",
};

function slugify(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function emptyForm(): CampaignForm {
  return { name: "", slug: "", type: "custom", description: "", discount_pct: 10, starts_at: "", ends_at: "", active: true };
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function isActive(c: Campaign) {
  if (!c.active) return false;
  const now = new Date();
  if (c.starts_at && new Date(c.starts_at) > now) return false;
  if (c.ends_at && new Date(c.ends_at) < now) return false;
  return true;
}

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<CampaignForm>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  // Product section (after save)
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [savingProducts, setSavingProducts] = useState(false);

  // Campaign product counts
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: cData } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    const camps = cData ?? [];
    setCampaigns(camps);

    // load product counts
    if (camps.length > 0) {
      const { data: cpData } = await supabase
        .from("campaign_products")
        .select("campaign_id")
        .in("campaign_id", camps.map(c => c.id));
      const counts: Record<string, number> = {};
      (cpData ?? []).forEach(r => { counts[r.campaign_id] = (counts[r.campaign_id] ?? 0) + 1; });
      setProductCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("id, name, code, images").order("name");
    setProducts(data ?? []);
  }, []);

  const loadSelectedProducts = useCallback(async (cid: string) => {
    const { data } = await supabase.from("campaign_products").select("product_id").eq("campaign_id", cid);
    setSelectedProductIds(new Set((data ?? []).map(r => r.product_id)));
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setEditId(null);
    setSlugManual(false);
    setSavedCampaignId(null);
    setSelectedProductIds(new Set());
    setPanelOpen(true);
  };

  const openEdit = async (c: Campaign) => {
    setForm({
      name: c.name, slug: c.slug, type: c.type,
      description: c.description ?? "", discount_pct: c.discount_pct,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
      active: c.active,
    });
    setEditId(c.id);
    setSlugManual(true);
    setSavedCampaignId(c.id);
    await loadProducts();
    await loadSelectedProducts(c.id);
    setPanelOpen(true);
  };

  const handleNameChange = (v: string) => {
    setForm(f => ({ ...f, name: v, ...(!slugManual ? { slug: slugify(v) } : {}) }));
  };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      ...form,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };
    let cid = editId;
    if (editId) {
      await supabase.from("campaigns").update(payload).eq("id", editId);
    } else {
      const { data } = await supabase.from("campaigns").insert(payload).select().single();
      cid = data?.id ?? null;
    }
    setSaving(false);
    setSavedCampaignId(cid);
    await loadProducts();
    if (cid) await loadSelectedProducts(cid);
    load();
  };

  const saveProducts = async () => {
    if (!savedCampaignId) return;
    setSavingProducts(true);
    // delete existing and re-insert
    await supabase.from("campaign_products").delete().eq("campaign_id", savedCampaignId);
    if (selectedProductIds.size > 0) {
      await supabase.from("campaign_products").insert(
        Array.from(selectedProductIds).map(pid => ({ campaign_id: savedCampaignId, product_id: pid }))
      );
    }
    setSavingProducts(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir campanha?")) return;
    await supabase.from("campaign_products").delete().eq("campaign_id", id);
    await supabase.from("campaigns").delete().eq("id", id);
    load();
  };

  const toggleCampaign = async (c: Campaign) => {
    await supabase.from("campaigns").update({ active: !c.active }).eq("id", c.id);
    load();
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.code ?? "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const activeNow = campaigns.filter(isActive).length;
  const totalProducts = Object.values(productCounts).reduce((s, v) => s + v, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie campanhas de marketing e promoções</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#8C2F39" }}
        >
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Campanhas", value: campaigns.length, icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ativas Agora", value: activeNow, icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
          { label: "Produtos em Campanhas", value: totalProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className={`${k.bg} p-3 rounded-lg`}>
              <k.icon size={20} className={k.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-lg font-bold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign cards */}
      {loading ? (
        <div className="text-center text-gray-400 py-12 text-sm">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">Nenhuma campanha criada ainda.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                  <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {TYPE_LABELS[c.type] ?? c.type}
                  </span>
                </div>
                <button
                  onClick={() => toggleCampaign(c)}
                  className={isActive(c) ? "text-green-500" : "text-gray-300"}
                >
                  {isActive(c) ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(c.starts_at)} → {fmtDate(c.ends_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-medium">
                  <Tag size={10} className="inline mr-1" />{c.discount_pct}% desc.
                </span>
                <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded">
                  <Package size={10} className="inline mr-1" />{productCounts[c.id] ?? 0} produtos
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => openEdit(c)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                >
                  <Edit size={12} /> Editar
                </button>
                <button
                  onClick={() => del(c.id)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-400 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editId ? "Editar Campanha" : "Nova Campanha"}</h2>
              <button onClick={() => setPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Black Friday 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                    value={form.slug}
                    onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                    placeholder="black-friday-2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 resize-none"
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descrição da campanha..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Desconto (%)</label>
                  <input
                    type="number" min={0} max={100} step={0.5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                    value={form.discount_pct}
                    onChange={e => setForm(f => ({ ...f, discount_pct: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Início</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                      value={form.starts_at}
                      onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fim</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                      value={form.ends_at}
                      onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 accent-[#8C2F39]"
                  />
                  <span className="text-sm text-gray-700">Ativa</span>
                </label>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#8C2F39" }}
              >
                <Save size={14} /> {saving ? "Salvando..." : "Salvar Campanha"}
              </button>

              {/* Products section — shown after campaign is saved */}
              {savedCampaignId && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">Adicionar Produtos</h3>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                      placeholder="Buscar produto..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />
                  </div>

                  {selectedProductIds.size > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(selectedProductIds).map(pid => {
                        const p = products.find(x => x.id === pid);
                        if (!p) return null;
                        return (
                          <span key={pid} className="flex items-center gap-1 text-xs bg-[#8C2F39]/10 text-[#8C2F39] px-2 py-1 rounded-full">
                            {p.name}
                            <button onClick={() => toggleProduct(pid)}><X size={10} /></button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Nenhum produto encontrado.</p>
                    ) : filteredProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(p.id)}
                          onChange={() => toggleProduct(p.id)}
                          className="w-3.5 h-3.5 accent-[#8C2F39]"
                        />
                        <span className="text-sm text-gray-700 truncate">{p.name}</span>
                        {p.code && <span className="text-xs text-gray-400 font-mono ml-auto">{p.code}</span>}
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={saveProducts}
                    disabled={savingProducts}
                    className="w-full py-2 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ borderColor: "#8C2F39", color: "#8C2F39" }}
                  >
                    <Save size={14} /> {savingProducts ? "Salvando..." : `Salvar ${selectedProductIds.size} produto(s)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
