"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Search, Edit, Trash2, Save, X, Package,
  ChevronLeft, Star, Sparkles, TrendingUp, Eye, EyeOff,
  Weight, Ruler, Palette, Tag, Upload, Globe, Filter,
} from "lucide-react";

const DEFAULT_SIZES = ["PP", "P", "M", "G", "GG", "XG", "Único"];
const MEASURE_KEYS = ["busto", "cintura", "quadril", "comprimento"];

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  code: string | null;
  category_id: string | null;
  base_price: number;
  pix_price: number | null;
  sale_price: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  images: string[];
  weight_kg: number | null;
  pkg_height_cm: number | null;
  pkg_width_cm: number | null;
  pkg_length_cm: number | null;
  colors: string[];
  sizes: string[];
  size_chart: Record<string, Record<string, string>>;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
};

type Category = { id: string; name: string };
type Sku = { size: string; color: string; stock_qty: number };

function slugify(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function emptyProduct(): Omit<Product, "id" | "created_at"> {
  return {
    name: "", slug: "", description: "", code: "", category_id: null,
    base_price: 0, pix_price: null, sale_price: null, stock: 0,
    active: true, featured: false, is_new: true, is_bestseller: false,
    images: [],
    weight_kg: 0.3, pkg_height_cm: 5, pkg_width_cm: 15, pkg_length_cm: 20,
    colors: [], sizes: [],
    size_chart: {},
    meta_title: null, meta_description: null,
  };
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<(Omit<Product, "id" | "created_at"> & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Images as separate text area
  const [imagesInput, setImagesInput] = useState("");
  // Colors as comma/newline input
  const [colorInput, setColorInput] = useState("");
  // SKUs (size×color grid)
  const [skus, setSkus] = useState<Sku[]>([]);
  // Image upload state
  const [uploading, setUploading] = useState(false);
  // List filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">("");

  const supabase = createClient();

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    setImagesInput(prev => [...prev.split("\n").filter(Boolean), ...urls].join("\n"));
    setUploading(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").eq("active", true).order("name"),
    ]);
    setProducts((prodRes.data || []) as Product[]);
    setCategories(catRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.code || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.category_id !== filterCategory) return false;
    if (filterStatus === "active" && !p.active) return false;
    if (filterStatus === "inactive" && p.active) return false;
    return true;
  });

  const openNew = () => {
    setEditing(emptyProduct());
    setImagesInput("");
    setColorInput("");
    setSkus([]);
  };

  const openEdit = async (p: Product) => {
    setEditing({ ...p });
    setImagesInput((p.images || []).join("\n"));
    setColorInput((p.colors || []).join("\n"));
    // Load SKUs
    const { data } = await supabase
      .from("product_skus")
      .select("size, color, stock_qty")
      .eq("product_id", p.id);
    setSkus((data || []) as Sku[]);
  };

  // Build SKU grid whenever sizes or colors change
  const getSizes = () => editing?.sizes || [];
  const getColors = () => colorInput.split(/[\n,]/).map((c) => c.trim()).filter(Boolean);

  const getSkuStock = (size: string, color: string) => {
    const found = skus.find((s) => s.size === size && s.color === color);
    return found?.stock_qty ?? 0;
  };

  const setSkuStock = (size: string, color: string, qty: number) => {
    setSkus((prev) => {
      const idx = prev.findIndex((s) => s.size === size && s.color === color);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], stock_qty: qty };
        return next;
      }
      return [...prev, { size, color, stock_qty: qty }];
    });
  };

  const toggleSize = (size: string) => {
    if (!editing) return;
    const sizes = editing.sizes || [];
    setEditing({
      ...editing,
      sizes: sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size],
    });
  };

  const handleSave = async () => {
    if (!editing || !editing.name) return;
    setSaving(true);

    const images = imagesInput.split("\n").map((s) => s.trim()).filter(Boolean);
    const colors = colorInput.split(/[\n,]/).map((c) => c.trim()).filter(Boolean);
    const pixPrice = editing.pix_price ?? +(editing.base_price * 0.9).toFixed(2);

    const payload = {
      name: editing.name,
      slug: editing.slug || slugify(editing.name),
      description: editing.description || null,
      code: editing.code || null,
      category_id: editing.category_id || null,
      base_price: editing.base_price,
      pix_price: pixPrice,
      sale_price: editing.sale_price || null,
      stock: editing.stock,
      active: editing.active,
      featured: editing.featured,
      is_new: editing.is_new,
      is_bestseller: editing.is_bestseller,
      images,
      weight_kg: editing.weight_kg || 0.3,
      pkg_height_cm: editing.pkg_height_cm || 5,
      pkg_width_cm: editing.pkg_width_cm || 15,
      pkg_length_cm: editing.pkg_length_cm || 20,
      colors,
      sizes: editing.sizes || [],
      size_chart: editing.size_chart || {},
      meta_title: editing.meta_title || null,
      meta_description: editing.meta_description || null,
    };

    let productId = editing.id;
    if (productId) {
      await supabase.from("products").update(payload).eq("id", productId);
    } else {
      const { data } = await supabase.from("products").insert(payload).select().single();
      productId = data?.id;
    }

    // Save SKUs
    if (productId && skus.length > 0) {
      for (const sku of skus) {
        await supabase
          .from("product_skus")
          .upsert({
            product_id: productId,
            size: sku.size,
            color: sku.color,
            stock_qty: sku.stock_qty,
          }, { onConflict: "product_id,size,color" });
      }
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    load();
  };

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  if (editing !== null) {
    const pixPreview = editing.pix_price ?? +(editing.base_price * 0.9).toFixed(2);
    const sizes = getSizes();
    const colors = getColors();

    return (
      <div className="p-6 max-w-4xl">
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6">
          <ChevronLeft size={18} /> Voltar para lista
        </button>

        <h2 className="text-2xl font-bold mb-6">{editing.id ? "Editar Produto" : "Novo Produto"}</h2>

        <div className="space-y-6">
          {/* ── INFORMAÇÕES BÁSICAS ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Tag size={16} /> Informações básicas</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Nome do Produto *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: slugify(e.target.value) })}
                  className="input"
                  placeholder="Ex: Top Fitness Refúgio"
                />
              </div>
              <div>
                <label className="label">Código / Referência</label>
                <input type="text" value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} className="input" placeholder="FEM-001" />
              </div>
              <div>
                <label className="label">Categoria</label>
                <select value={editing.category_id || ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })} className="input">
                  <option value="">— Sem categoria —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Descrição</label>
                <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="input" placeholder="Descreva o produto..." />
              </div>
            </div>
          </section>

          {/* ── PREÇOS ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Preços</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">Preço cheio (R$) *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={editing.base_price}
                  onChange={(e) => setEditing({ ...editing, base_price: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Aparece riscado quando há desconto</p>
              </div>
              <div>
                <label className="label">Preço PIX (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={editing.pix_price ?? ""}
                  onChange={(e) => setEditing({ ...editing, pix_price: parseFloat(e.target.value) || null })}
                  className="input"
                  placeholder={`${pixPreview.toFixed(2)} (10% off auto)`}
                />
              </div>
              <div>
                <label className="label">Preço promocional (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={editing.sale_price ?? ""}
                  onChange={(e) => setEditing({ ...editing, sale_price: parseFloat(e.target.value) || null })}
                  className="input"
                  placeholder="Deixe vazio se não há"
                />
              </div>
            </div>
          </section>

          {/* ── EMBALAGEM ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Weight size={16} /> Peso e dimensões da embalagem</h3>
            <p className="text-xs text-gray-400 mb-4">Usado para calcular o frete via Melhor Envio</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Peso (kg)</label>
                <input type="number" step="0.001" min="0" value={editing.weight_kg ?? ""} onChange={(e) => setEditing({ ...editing, weight_kg: parseFloat(e.target.value) || 0 })} className="input" placeholder="0.300" />
              </div>
              <div>
                <label className="label">Comprimento (cm)</label>
                <input type="number" step="0.1" min="0" value={editing.pkg_length_cm ?? ""} onChange={(e) => setEditing({ ...editing, pkg_length_cm: parseFloat(e.target.value) || 0 })} className="input" placeholder="20" />
              </div>
              <div>
                <label className="label">Largura (cm)</label>
                <input type="number" step="0.1" min="0" value={editing.pkg_width_cm ?? ""} onChange={(e) => setEditing({ ...editing, pkg_width_cm: parseFloat(e.target.value) || 0 })} className="input" placeholder="15" />
              </div>
              <div>
                <label className="label">Altura (cm)</label>
                <input type="number" step="0.1" min="0" value={editing.pkg_height_cm ?? ""} onChange={(e) => setEditing({ ...editing, pkg_height_cm: parseFloat(e.target.value) || 0 })} className="input" placeholder="5" />
              </div>
            </div>
          </section>

          {/* ── TAMANHOS ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Ruler size={16} /> Tamanhos disponíveis</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {DEFAULT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                    sizes.includes(size)
                      ? "bg-[#8C2F39] border-[#8C2F39] text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {/* Tabela de medidas */}
            {sizes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Tabela de medidas (cm)</p>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left text-gray-500">Medida</th>
                        {sizes.map((s) => (
                          <th key={s} className="border border-gray-200 px-3 py-2 text-center text-gray-700 font-semibold">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MEASURE_KEYS.map((key) => (
                        <tr key={key}>
                          <td className="border border-gray-200 px-3 py-2 text-gray-500 capitalize font-medium">{key}</td>
                          {sizes.map((size) => (
                            <td key={size} className="border border-gray-200 p-1">
                              <input
                                type="text"
                                value={(editing.size_chart?.[size]?.[key]) || ""}
                                onChange={(e) => {
                                  const chart = { ...(editing.size_chart || {}) };
                                  chart[size] = { ...(chart[size] || {}), [key]: e.target.value };
                                  setEditing({ ...editing, size_chart: chart });
                                }}
                                className="w-full text-center px-1 py-1 border-0 bg-transparent focus:bg-white focus:border focus:border-[#8C2F39] rounded text-xs"
                                placeholder="—"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── CORES ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Palette size={16} /> Cores disponíveis</h3>
            <div>
              <label className="label">Nome das cores (uma por linha)</label>
              <textarea
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                rows={4}
                className="input font-mono text-sm"
                placeholder={"Preto\nBranco\nRosa Blush\nVerde Oliva"}
              />
            </div>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {colors.map((c) => (
                  <span key={c} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{c}</span>
                ))}
              </div>
            )}
          </section>

          {/* ── GRADE DE ESTOQUE ── */}
          {sizes.length > 0 && colors.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Grade de estoque (Tamanho × Cor)</h3>
              <div className="overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left text-gray-500">Cor \ Tam</th>
                      {sizes.map((s) => (
                        <th key={s} className="border border-gray-200 px-3 py-2 text-center font-semibold">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {colors.map((color) => (
                      <tr key={color}>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600 font-medium whitespace-nowrap">{color}</td>
                        {sizes.map((size) => (
                          <td key={size} className="border border-gray-200 p-1">
                            <input
                              type="number"
                              min="0"
                              value={getSkuStock(size, color)}
                              onChange={(e) => setSkuStock(size, color, parseInt(e.target.value) || 0)}
                              className="w-14 text-center px-1 py-1.5 border rounded text-xs focus:ring-1 focus:ring-[#8C2F39] focus:border-[#8C2F39]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── IMAGENS ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Imagens</h3>
            <p className="text-xs text-gray-400 mb-3">Primeira = frente · Segunda = costas · demais = detalhes</p>

            {/* File upload */}
            <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-5 cursor-pointer transition-colors ${uploading ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-[#8C2F39] hover:bg-red-50/30"}`}>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files && uploadImages(e.target.files)}
              />
              <Upload size={18} className={uploading ? "text-gray-400 animate-pulse" : "text-gray-500"} />
              <span className="text-sm text-gray-500">{uploading ? "Enviando..." : "Clique para enviar fotos"}</span>
            </label>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">ou cole URLs</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <textarea
              value={imagesInput}
              onChange={(e) => setImagesInput(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#8C2F39]"
              placeholder={"https://exemplo.com/frente.jpg\nhttps://exemplo.com/costas.jpg"}
            />
            {imagesInput.split("\n").filter(Boolean).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {imagesInput.split("\n").filter(Boolean).map((url, i) => (
                  <div key={i} className="relative group w-20 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={url.trim()} alt="" fill className="object-cover" onError={() => {}} />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">
                      {i === 0 ? "Frente" : i === 1 ? "Costas" : `Foto ${i + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImagesInput(imagesInput.split("\n").filter((_, idx) => idx !== i).join("\n"))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── SEO ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Globe size={16} /> SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="label">URL (slug)</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#8C2F39]">
                  <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">/produto/</span>
                  <input
                    type="text"
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                    placeholder="nome-do-produto"
                  />
                </div>
              </div>
              <div>
                <label className="label">Meta title</label>
                <input
                  type="text"
                  value={editing.meta_title || ""}
                  onChange={(e) => setEditing({ ...editing, meta_title: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]"
                  placeholder={editing.name || "Título para o Google"}
                  maxLength={70}
                />
                <p className="text-xs text-gray-400 mt-1">{(editing.meta_title || "").length}/70 caracteres</p>
              </div>
              <div>
                <label className="label">Meta description</label>
                <textarea
                  value={editing.meta_description || ""}
                  onChange={(e) => setEditing({ ...editing, meta_description: e.target.value || null })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]"
                  placeholder="Descrição que aparece no resultado de busca do Google"
                  maxLength={160}
                />
                <p className="text-xs text-gray-400 mt-1">{(editing.meta_description || "").length}/160 caracteres</p>
              </div>
            </div>
          </section>

          {/* ── ESTOQUE GERAL + BADGES ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Estoque e visibilidade</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Estoque geral (sem grade)</label>
                <input
                  type="number" min="0"
                  value={editing.stock}
                  onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Use a grade acima se tiver variações</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: "active",       label: "Ativo",        icon: Eye },
                { key: "featured",     label: "Destaque",     icon: Star },
                { key: "is_new",       label: "Novidade",     icon: Sparkles },
                { key: "is_bestseller",label: "Mais Vendido", icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => {
                const val = editing[key as keyof typeof editing] as boolean;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditing({ ...editing, [key]: !val })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      val ? "bg-[#8C2F39] border-[#8C2F39] text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={15} />{label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── ACTIONS ── */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={handleSave}
              disabled={saving || !editing.name}
              className="flex items-center gap-2 bg-[#8C2F39] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#7a2832] disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar Produto"}
            </button>
            <button onClick={() => setEditing(null)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>

        <style>{`.label{display:block;font-size:.75rem;font-weight:500;color:#374151;margin-bottom:.25rem}.input{width:100%;padding:.5rem 1rem;border:1px solid #e5e7eb;border-radius:.5rem;font-size:.875rem;outline:none}.input:focus{border-color:#8C2F39;box-shadow:0 0 0 2px rgba(140,47,57,.15)}`}</style>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#7a2832]">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8C2F39] text-gray-600"
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "" | "active" | "inactive")}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8C2F39] text-gray-600"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        {(search || filterCategory || filterStatus) && (
          <button
            onClick={() => { setSearch(""); setFilterCategory(""); setFilterStatus(""); }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 px-2"
          >
            <X size={14} /> Limpar
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
          <Package size={56} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => {
            const imgs = Array.isArray(product.images) ? product.images : [];
            return (
              <div key={product.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${product.active ? "border-gray-100" : "border-gray-200 opacity-60"}`}>
                <div className="relative aspect-[3/4] bg-gray-100">
                  {imgs[0] ? (
                    <Image src={imgs[0]} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={40} className="text-gray-300" />
                    </div>
                  )}
                  {!product.active && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <EyeOff size={24} className="text-gray-500" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_new && <span className="bg-[#8C2F39] text-white text-xs px-2 py-0.5 rounded font-semibold">NOVO</span>}
                    {product.featured && <span className="bg-[#D4A956] text-white text-xs px-2 py-0.5 rounded font-semibold">DESTAQUE</span>}
                  </div>
                  {product.sizes?.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                      {product.sizes.slice(0, 4).map((s) => (
                        <span key={s} className="bg-white/90 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {product.code && <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.code}</p>}
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  {product.colors?.length > 0 && (
                    <p className="text-xs text-gray-400 mb-1">{product.colors.length} cor{product.colors.length > 1 ? "es" : ""}</p>
                  )}
                  <p className="text-base font-bold text-[#8C2F39]">
                    R$ {product.base_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    PIX: R$ {(product.pix_price ?? product.base_price * 0.9).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openEdit(product)} className="flex-1 flex items-center justify-center gap-1 text-sm bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700">
                      <Edit size={14} /> Editar
                    </button>
                    <button onClick={() => toggleActive(product)} className="p-2 border rounded-lg hover:bg-gray-50" title={product.active ? "Desativar" : "Ativar"}>
                      {product.active ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-gray-400" />}
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 border border-red-200 rounded-lg hover:bg-red-50">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
