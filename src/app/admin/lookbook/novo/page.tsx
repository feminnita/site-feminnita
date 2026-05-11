"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HotspotEditor, type HotspotEntry } from "@/components/HotspotEditor";
import { Save, ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

const SEASONS = ["Verão 2025", "Outono 2025", "Inverno 2025", "Primavera 2025", "Verão 2026"];

type ProductOption = { id: string; name: string; images: string[] };

export default function NovoLookbookPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "", title: "", description: "", cover_image: "", season: "", published: false,
  });
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [hotspots, setHotspots] = useState<HotspotEntry[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const autoSlug = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, images")
      .eq("active", true)
      .order("name")
      .limit(200)
      .then(({ data }) => setAllProducts(data || []));
  }, []);

  const addProduct = (p: ProductOption) => {
    if (hotspots.find((h) => h.product_id === p.id)) return;
    setHotspots((prev) => [...prev, { product_id: p.id, product_name: p.name, hotspot_x: null, hotspot_y: null }]);
    setProductSearch("");
  };

  const removeProduct = (id: string) => {
    setHotspots((prev) => prev.filter((h) => h.product_id !== id));
  };

  const filtered = allProducts.filter(
    (p) =>
      productSearch.length > 1 &&
      p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
      !hotspots.find((h) => h.product_id === p.id)
  );

  const save = async () => {
    if (!form.title) { alert("Título obrigatório"); return; }
    setSaving(true);

    const { data: entry, error } = await supabase
      .from("lookbook_entries")
      .insert(form)
      .select()
      .single();

    if (error || !entry) {
      setSaving(false);
      alert("Erro: " + error?.message);
      return;
    }

    // Save lookbook_products with hotspot coords
    if (hotspots.length > 0) {
      await supabase.from("lookbook_products").insert(
        hotspots.map((h) => ({
          lookbook_id: entry.id,
          product_id: h.product_id,
          hotspot_x: h.hotspot_x,
          hotspot_y: h.hotspot_y,
        }))
      );
    }

    setSaving(false);
    router.push("/admin/lookbook");
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/lookbook" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-semibold">Novo look</h1>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" value={form.title}
            onChange={(e) => { set("title", e.target.value); set("slug", autoSlug(e.target.value)); }}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8C2F39]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de capa (URL)</label>
          <input type="text" value={form.cover_image} onChange={(e) => set("cover_image", e.target.value)}
            placeholder="https://..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coleção / Estação</label>
          <select value={form.season} onChange={(e) => set("season", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]">
            <option value="">Selecionar...</option>
            {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Products */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Peças do look</label>
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
            />
            {filtered.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                {filtered.map((p) => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left">
                    <Plus size={14} className="text-[#8C2F39] shrink-0" />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hotspots.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {hotspots.map((h) => (
                <div key={h.product_id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs">
                  {h.product_name.slice(0, 28)}
                  {h.hotspot_x != null && <span className="text-green-600 ml-1">📍</span>}
                  <button type="button" onClick={() => removeProduct(h.product_id)} className="text-gray-400 hover:text-red-500 ml-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hotspot editor */}
        {form.cover_image && hotspots.length > 0 && (
          <HotspotEditor
            coverImage={form.cover_image}
            hotspots={hotspots}
            onChange={setHotspots}
          />
        )}

        <div className="flex items-center gap-3 pt-2">
          <input type="checkbox" id="pub" checked={form.published} onChange={(e) => set("published", e.target.checked)}
            className="w-4 h-4 accent-[#8C2F39]" />
          <label htmlFor="pub" className="text-sm text-gray-700">Publicar imediatamente</label>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#8C2F39] text-white py-3 rounded-lg hover:bg-[#7a2832] font-medium disabled:opacity-50">
          <Save size={16} /> {saving ? "Salvando..." : "Criar look"}
        </button>
      </div>
    </div>
  );
}
