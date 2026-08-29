"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Search, Edit, Trash2, Save, X, Package,
  ChevronLeft, Star, Sparkles, TrendingUp, Eye, EyeOff,
  Weight, Ruler, Palette, Tag, Upload, Globe, Filter,
  LayoutGrid, List, ArrowUpDown, CheckSquare, Square,
  Download, ChevronDown, ChevronUp, Power, Layers, Percent,
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
  color_images: Record<string, string[]>;
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
// Uma variação = uma linha (cor × tamanho), no estilo Tray: cada uma independente.
type Sku = {
  size: string;
  color: string;
  stock_qty: number;
  price: number | null;
  sale_price: number | null;
  reference: string | null;
  ean: string | null;
  cost_price: number | null;
  min_stock: number | null;
  sale_start: string | null;
  sale_end: string | null;
  active: boolean;
  weight_kg: number | null;
  pkg_height_cm: number | null;
  pkg_width_cm: number | null;
  pkg_length_cm: number | null;
};

const SKU_SELECT =
  "size, color, stock_qty, price, sale_price, reference, ean, cost_price, min_stock, sale_start, sale_end, active, weight_kg, pkg_height_cm, pkg_width_cm, pkg_length_cm";

function newSku(size: string, color: string): Sku {
  return {
    size, color, stock_qty: 0, price: null, sale_price: null,
    reference: null, ean: null, cost_price: null, min_stock: 0,
    sale_start: null, sale_end: null, active: true,
    weight_kg: null, pkg_height_cm: null, pkg_width_cm: null, pkg_length_cm: null,
  };
}

function slugify(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function emptyProduct(): Omit<Product, "id" | "created_at"> {
  return {
    name: "", slug: "", description: "", code: "", category_id: null,
    base_price: 0, pix_price: null, sale_price: null, stock: 0,
    active: true, featured: false, is_new: true, is_bestseller: false,
    images: [],
    color_images: {},
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
  // SKUs — cada linha é uma variação (cor × tamanho) editável de forma independente
  const [skus, setSkus] = useState<Sku[]>([]);
  // Qual card de variação está expandido (key "color|size"); null = todos fechados
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  // Chaves das variações carregadas do banco, para saber o que apagar ao salvar
  const [loadedSkuKeys, setLoadedSkuKeys] = useState<Set<string>>(new Set());
  // Image upload state
  const [uploading, setUploading] = useState(false);
  // Imagens por cor { cor: [urls] } + qual cor está enviando
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  // List filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">("");
  // View mode & sort
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"created_at" | "name" | "base_price" | "stock">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const uploadColorImages = async (color: string, files: FileList) => {
    setUploadingColor(color);
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
    setColorImages((prev) => ({ ...prev, [color]: [...(prev[color] || []), ...urls] }));
    setUploadingColor(null);
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

  const filtered = products
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.code || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && p.category_id !== filterCategory) return false;
      if (filterStatus === "active" && !p.active) return false;
      if (filterStatus === "inactive" && p.active) return false;
      return true;
    })
    .sort((a, b) => {
      let va: any = a[sortBy], vb: any = b[sortBy];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const selectAll = () => setSelected(
    selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id))
  );

  const bulkActivate = async (active: boolean) => {
    await Promise.all([...selected].map(id => supabase.from("products").update({ active }).eq("id", id)));
    setSelected(new Set());
    load();
  };

  const bulkDelete = async () => {
    if (!confirm(`Excluir ${selected.size} produto(s)?`)) return;
    await Promise.all([...selected].map(id => supabase.from("products").delete().eq("id", id)));
    setSelected(new Set());
    load();
  };

  const exportCSV = () => {
    const rows = [
      ["Nome", "Código", "Preço", "PIX", "Estoque", "Status", "Tamanhos", "Cores"],
      ...filtered.map(p => [
        p.name, p.code || "", p.base_price, p.pix_price ?? (p.base_price * 0.9).toFixed(2),
        p.stock, p.active ? "Ativo" : "Inativo",
        (p.sizes || []).join("/"), (p.colors || []).join("/"),
      ])
    ];
    const blob = new Blob(["﻿" + rows.map(r => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "produtos.csv"; a.click();
  };

  const skuKey = (s: { color: string; size: string }) => `${s.color}|${s.size}`;

  const openNew = () => {
    setEditing(emptyProduct());
    setImagesInput("");
    setColorInput("");
    setColorImages({});
    setSkus([]);
    setLoadedSkuKeys(new Set());
    setExpandedSku(null);
  };

  const openEdit = async (p: Product) => {
    setEditing({ ...p });
    setImagesInput((p.images || []).join("\n"));
    setColorInput((p.colors || []).join("\n"));
    setColorImages((p.color_images && typeof p.color_images === "object" && !Array.isArray(p.color_images)) ? p.color_images : {});
    setExpandedSku(null);
    // Load SKUs (variações)
    const { data } = await supabase
      .from("product_skus")
      .select(SKU_SELECT)
      .eq("product_id", p.id);
    const rows = (data || []).map((r: any) => ({ ...newSku(r.size, r.color), ...r, active: r.active !== false })) as Sku[];
    setSkus(rows);
    setLoadedSkuKeys(new Set(rows.map(skuKey)));
  };

  // Build SKU grid whenever sizes or colors change
  const getSizes = () => editing?.sizes || [];
  const getColors = () => colorInput.split(/[\n,]/).map((c) => c.trim()).filter(Boolean);

  // Atualiza um campo de uma variação (por índice)
  const setSku = (idx: number, patch: Partial<Sku>) => {
    setSkus((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  // Excluir uma variação (só sai da lista; a remoção no banco acontece ao Salvar)
  const deleteSku = (idx: number) => {
    setSkus((prev) => prev.filter((_, i) => i !== idx));
  };
  // Inativar/ativar uma variação
  const toggleSkuActive = (idx: number) => {
    setSkus((prev) => prev.map((s, i) => (i === idx ? { ...s, active: !s.active } : s)));
  };

  // Gera as variações faltantes a partir das cores × tamanhos selecionados (não apaga as existentes)
  const generateVariations = () => {
    const colors = getColors();
    const sizes = getSizes();
    setSkus((prev) => {
      const have = new Set(prev.map(skuKey));
      const add: Sku[] = [];
      for (const color of colors) {
        for (const size of sizes) {
          const k = `${color}|${size}`;
          if (!have.has(k)) add.push(newSku(size, color));
        }
      }
      return [...prev, ...add];
    });
  };

  // % de desconto de uma variação (promocional vs venda/base)
  const skuDiscount = (s: Sku) => {
    const full = s.price ?? editing?.base_price ?? 0;
    if (!s.sale_price || !full || s.sale_price >= full) return null;
    return Math.round((1 - s.sale_price / full) * 100);
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
      color_images: Object.fromEntries(Object.entries(colorImages).filter(([c]) => colors.includes(c))),
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

    // Salvar variações (product_skus)
    if (productId) {
      // 1) apaga do banco as variações que foram removidas nesta edição
      const currentKeys = new Set(skus.map(skuKey));
      for (const key of loadedSkuKeys) {
        if (!currentKeys.has(key)) {
          const [color, size] = key.split("|");
          await supabase.from("product_skus")
            .delete().eq("product_id", productId).eq("color", color).eq("size", size);
        }
      }
      // 2) upsert de cada variação atual com todos os campos
      for (const sku of skus) {
        await supabase
          .from("product_skus")
          .upsert({
            product_id: productId,
            size: sku.size,
            color: sku.color,
            stock_qty: sku.stock_qty || 0,
            price: sku.price,
            sale_price: sku.sale_price,
            reference: sku.reference || null,
            ean: sku.ean || null,
            cost_price: sku.cost_price,
            min_stock: sku.min_stock || 0,
            sale_start: sku.sale_start || null,
            sale_end: sku.sale_end || null,
            active: sku.active,
            weight_kg: sku.weight_kg,
            pkg_height_cm: sku.pkg_height_cm,
            pkg_width_cm: sku.pkg_width_cm,
            pkg_length_cm: sku.pkg_length_cm,
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
            <h3 className="font-semibold text-gray-700 mb-4">Preço padrão <span className="font-normal text-xs text-gray-400">(usado quando a variação não tem preço próprio)</span></h3>
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

          {/* ── VARIAÇÕES (estilo Tray: fotos por estampa + 1 card por cor × tamanho) ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Layers size={16} /> Variações {skus.length > 0 && <span className="text-gray-400 font-normal">({skus.length})</span>}</h3>
              <div className="flex items-center gap-2">
                {skus.length > 0 && (
                  <button type="button" onClick={() => setExpandedSku(expandedSku === "*" ? null : "*")} className="text-xs text-gray-500 hover:text-gray-800">
                    {expandedSku === "*" ? "Recolher todas" : "Expandir todas"}
                  </button>
                )}
                <button type="button" onClick={generateVariations}
                  className="flex items-center gap-1.5 text-xs bg-[#8C2F39] text-white px-3 py-1.5 rounded-lg hover:bg-[#7a2832]">
                  <Plus size={14} /> Gerar variações (cor × tamanho)
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">Cada variação (cor + tamanho) é independente: estoque, preço, referência, EAN, promoção e status próprios. Preço/peso vazios herdam do produto. As fotos são por estampa/cor.</p>

            {colors.length === 0 || sizes.length === 0 ? (
              <p className="text-sm text-amber-600">Defina as <b>cores</b> e os <b>tamanhos</b> nas seções acima e clique em <b>Gerar variações</b>.</p>
            ) : skus.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma variação ainda. Clique em <b>Gerar variações</b> para criar uma para cada cor × tamanho.</p>
            ) : (
              <div className="space-y-6">
                {colors.map((color) => {
                  const imgs = colorImages[color] || [];
                  const colorSkus = skus
                    .map((s, i) => ({ s, i }))
                    .filter(({ s }) => s.color === color)
                    .sort((a, b) => sizes.indexOf(a.s.size) - sizes.indexOf(b.s.size));
                  if (colorSkus.length === 0) return null;
                  return (
                    <div key={color} className="border border-gray-100 rounded-xl overflow-hidden">
                      {/* Cabeçalho da estampa: nome + fotos da cor */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Palette size={14} /> {color}</span>
                          <span className="text-xs text-gray-400">{imgs.length} foto{imgs.length !== 1 ? "s" : ""} · {colorSkus.length} tamanho{colorSkus.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {imgs.map((url, i) => (
                            <div key={i} className="relative group w-14 h-16 bg-white rounded-lg overflow-hidden border border-gray-200">
                              <Image src={url} alt="" fill className="object-cover" />
                              {i === 0 && <span className="absolute top-0 left-0 bg-[#8C2F39] text-white text-[8px] px-1 rounded-br">Principal</span>}
                              <button type="button"
                                onClick={() => setColorImages((prev) => ({ ...prev, [color]: (prev[color] || []).filter((_, idx) => idx !== i) }))}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                            </div>
                          ))}
                          <label className={`flex items-center justify-center gap-1 h-16 px-3 border-2 border-dashed rounded-lg cursor-pointer ${uploadingColor === color ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-[#8C2F39] hover:bg-red-50/30"}`}>
                            <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingColor === color} onChange={(e) => e.target.files && uploadColorImages(color, e.target.files)} />
                            <Upload size={14} className={uploadingColor === color ? "text-gray-400 animate-pulse" : "text-gray-500"} />
                            <span className="text-[11px] text-gray-500">{uploadingColor === color ? "Enviando..." : "Fotos"}</span>
                          </label>
                        </div>
                      </div>

                      {/* Cards de variação (um por tamanho desta cor) */}
                      <div className="divide-y divide-gray-50">
                        {colorSkus.map(({ s, i }) => {
                          const key = skuKey(s);
                          const open = expandedSku === "*" || expandedSku === key;
                          const disc = skuDiscount(s);
                          return (
                            <div key={key} className={s.active ? "" : "bg-gray-50/60"}>
                              {/* Cabeçalho do card */}
                              <div className="flex items-center gap-2 px-4 py-2.5">
                                <button type="button" onClick={() => setExpandedSku(open && expandedSku !== "*" ? null : key)} className="p-1 text-gray-400 hover:text-gray-700">
                                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <span className="text-sm font-medium text-gray-800">{color} · {s.size}</span>
                                {s.reference && <span className="text-xs text-gray-400">#{s.reference}</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${s.stock_qty > 0 ? "bg-gray-100 text-gray-600" : "bg-red-50 text-red-500"}`}>{s.stock_qty} un</span>
                                {disc !== null && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-0.5"><Percent size={10} />{disc}%</span>}
                                {!s.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Inativa</span>}
                                <div className="ml-auto flex items-center gap-1">
                                  <button type="button" onClick={() => toggleSkuActive(i)} title={s.active ? "Inativar" : "Ativar"} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                    <Power size={14} className={s.active ? "text-green-600" : "text-gray-400"} />
                                  </button>
                                  <button type="button" onClick={() => deleteSku(i)} title="Excluir variação" className="p-1.5 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={14} className="text-red-400" />
                                  </button>
                                </div>
                              </div>

                              {/* Corpo expandido */}
                              {open && (
                                <div className="px-4 pb-4 pt-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="label">Estoque</label>
                                    <input type="number" min="0" value={s.stock_qty}
                                      onChange={(e) => setSku(i, { stock_qty: parseInt(e.target.value) || 0 })} className="input" />
                                  </div>
                                  <div>
                                    <label className="label">Preço de venda (R$)</label>
                                    <input type="number" step="0.01" min="0" value={s.price ?? ""} placeholder={editing.base_price ? String(editing.base_price) : "herda"}
                                      onChange={(e) => setSku(i, { price: e.target.value === "" ? null : parseFloat(e.target.value) })} className="input" />
                                  </div>
                                  <div>
                                    <label className="label">Preço de custo (R$)</label>
                                    <input type="number" step="0.01" min="0" value={s.cost_price ?? ""} placeholder="—"
                                      onChange={(e) => setSku(i, { cost_price: e.target.value === "" ? null : parseFloat(e.target.value) })} className="input" />
                                  </div>
                                  <div>
                                    <label className="label">Referência</label>
                                    <input type="text" value={s.reference ?? ""} placeholder="ex 59200CASTANHOP"
                                      onChange={(e) => setSku(i, { reference: e.target.value || null })} className="input" />
                                  </div>
                                  <div>
                                    <label className="label">EAN / GTIN</label>
                                    <input type="text" value={s.ean ?? ""} placeholder="000000000000"
                                      onChange={(e) => setSku(i, { ean: e.target.value || null })} className="input" />
                                  </div>
                                  <div>
                                    <label className="label">Estoque mínimo</label>
                                    <input type="number" min="0" value={s.min_stock ?? 0}
                                      onChange={(e) => setSku(i, { min_stock: parseInt(e.target.value) || 0 })} className="input" />
                                  </div>

                                  {/* Promoção */}
                                  <div className="col-span-2 md:col-span-3 border-t border-gray-100 pt-3 mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                      <input type="checkbox" checked={s.sale_price != null}
                                        onChange={(e) => setSku(i, e.target.checked ? { sale_price: s.price ?? editing.base_price ?? 0 } : { sale_price: null, sale_start: null, sale_end: null })} />
                                      <span className="text-xs font-semibold text-gray-600">Preço em promoção</span>
                                      {disc !== null && <span className="text-xs text-green-600">(−{disc}%)</span>}
                                    </label>
                                    {s.sale_price != null && (
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div>
                                          <label className="label">Preço promocional (R$)</label>
                                          <input type="number" step="0.01" min="0" value={s.sale_price ?? ""}
                                            onChange={(e) => setSku(i, { sale_price: e.target.value === "" ? null : parseFloat(e.target.value) })} className="input" />
                                        </div>
                                        <div>
                                          <label className="label">Início</label>
                                          <input type="date" value={s.sale_start ?? ""}
                                            onChange={(e) => setSku(i, { sale_start: e.target.value || null })} className="input" />
                                        </div>
                                        <div>
                                          <label className="label">Fim</label>
                                          <input type="date" value={s.sale_end ?? ""}
                                            onChange={(e) => setSku(i, { sale_end: e.target.value || null })} className="input" />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Peso e dimensões da variação (herda do produto se vazio) */}
                                  <div className="col-span-2 md:col-span-3 border-t border-gray-100 pt-3">
                                    <p className="text-[11px] text-gray-400 mb-2">Peso e dimensões — vazio herda do produto ({editing.weight_kg ?? 0.3}kg · {editing.pkg_length_cm ?? 20}×{editing.pkg_width_cm ?? 15}×{editing.pkg_height_cm ?? 5}cm)</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div><label className="label">Peso (kg)</label>
                                        <input type="number" step="0.001" min="0" value={s.weight_kg ?? ""} placeholder={String(editing.weight_kg ?? 0.3)}
                                          onChange={(e) => setSku(i, { weight_kg: e.target.value === "" ? null : parseFloat(e.target.value) })} className="input" /></div>
                                      <div><label className="label">Compr. (cm)</label>
                                        <input type="number" step="0.1" min="0" value={s.pkg_length_cm ?? ""} placeholder={String(editing.pkg_length_cm ?? 20)}
                                          onChange={(e) => setSku(i, { pkg_length_cm: e.target.value === "" ? null : parseFloat(e.target.value) })} className="input" /></div>
                                      <div><label className="label">Largura (cm)</label>
                                        <input type="number" step="0.1" min="0" value={s.pkg_width_cm ?? ""} placeholder={String(editing.pkg_width_cm ?? 15)}
                                          onChange={(e) => setSku(i, { pkg_width_cm: e.target.value === "" ? null : parseFloat(e.target.value) })} className="input" /></div>
                                      <div><label className="label">Altura (cm)</label>
                                        <input type="number" step="0.1" min="0" value={s.pkg_height_cm ?? ""} placeholder={String(editing.pkg_height_cm ?? 5)}
                                          onChange={(e) => setSku(i, { pkg_height_cm: e.target.value === "" ? null : parseFloat(e.target.value) })} className="input" /></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50">
            <Download size={15} /> CSV
          </button>
          <button onClick={openNew} className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#7a2832]">
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#8C2F39]"
          />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8C2F39] text-gray-600">
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as "" | "active" | "inactive")}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8C2F39] text-gray-600">
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        {(search || filterCategory || filterStatus) && (
          <button onClick={() => { setSearch(""); setFilterCategory(""); setFilterStatus(""); }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 px-2">
            <X size={14} /> Limpar
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-400">{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</span>
          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              <List size={15} />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-gray-900 text-white rounded-xl px-5 py-3 mb-4 flex items-center gap-4">
          <span className="text-sm font-medium">{selected.size} selecionado{selected.size !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => bulkActivate(true)} className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg">Ativar</button>
            <button onClick={() => bulkActivate(false)} className="text-xs bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded-lg">Desativar</button>
            <button onClick={bulkDelete} className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg">Excluir</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-white px-2 ml-1"><X size={14} /></button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
          <Package size={56} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
        </div>
      ) : viewMode === "list" ? (
        /* ── TABLE VIEW ── */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500">
                <th className="w-10 px-4 py-3">
                  <button onClick={selectAll}>
                    {selected.size === filtered.length && filtered.length > 0
                      ? <CheckSquare size={16} className="text-[#8C2F39]" />
                      : <Square size={16} className="text-gray-400" />}
                  </button>
                </th>
                <th className="text-left px-3 py-3 w-12"></th>
                <th className="text-left px-3 py-3 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">Nome <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Código</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">Categoria</th>
                <th className="text-right px-3 py-3 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("base_price")}>
                  <span className="flex items-center justify-end gap-1">Preço <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-right px-3 py-3 cursor-pointer hover:text-gray-700 hidden md:table-cell" onClick={() => toggleSort("stock")}>
                  <span className="flex items-center justify-end gap-1">Estoque <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-center px-3 py-3">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(product => {
                const imgs = Array.isArray(product.images) ? product.images : [];
                const catName = categories.find(c => c.id === product.category_id)?.name;
                const isSelected = selected.has(product.id);
                return (
                  <tr key={product.id} className={`hover:bg-gray-50 ${isSelected ? "bg-rose-50" : ""}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(product.id)}>
                        {isSelected ? <CheckSquare size={16} className="text-[#8C2F39]" /> : <Square size={16} className="text-gray-300" />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-10 h-12 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                        {imgs[0]
                          ? <Image src={imgs[0]} alt={product.name} fill className="object-cover" />
                          : <Package size={16} className="text-gray-300 absolute inset-0 m-auto" />}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                      <div className="flex gap-1 mt-0.5">
                        {product.is_new && <span className="text-[10px] bg-[#8C2F39] text-white px-1.5 py-0.5 rounded font-semibold">NOVO</span>}
                        {product.featured && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-semibold">DESTAQUE</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs hidden md:table-cell">{product.code || "—"}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs hidden lg:table-cell">{catName || "—"}</td>
                    <td className="px-3 py-3 text-right">
                      <p className="font-semibold text-gray-900">R$ {product.base_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-400">PIX R$ {(product.pix_price ?? product.base_price * 0.9).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 hidden md:table-cell">
                      <span className={product.stock === 0 ? "text-red-500 font-medium" : ""}>{product.stock}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {product.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar">
                          <Edit size={14} className="text-gray-500" />
                        </button>
                        <button onClick={() => toggleActive(product)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={product.active ? "Desativar" : "Ativar"}>
                          {product.active ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-gray-400" />}
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Excluir">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => {
            const imgs = Array.isArray(product.images) ? product.images : [];
            const isSelected = selected.has(product.id);
            return (
              <div key={product.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isSelected ? "ring-2 ring-[#8C2F39]" : ""} ${product.active ? "border-gray-100" : "border-gray-200 opacity-60"}`}>
                <div className="relative aspect-[3/4] bg-gray-100">
                  <button onClick={() => toggleSelect(product.id)} className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded-lg">
                    {isSelected ? <CheckSquare size={16} className="text-[#8C2F39]" /> : <Square size={16} className="text-gray-400" />}
                  </button>
                  {imgs[0] ? <Image src={imgs[0]} alt={product.name} fill className="object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={40} className="text-gray-300" /></div>
                  )}
                  {!product.active && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><EyeOff size={24} className="text-gray-500" /></div>}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_new && <span className="bg-[#8C2F39] text-white text-xs px-2 py-0.5 rounded font-semibold">NOVO</span>}
                    {product.featured && <span className="bg-[#D4A956] text-white text-xs px-2 py-0.5 rounded font-semibold">DESTAQUE</span>}
                  </div>
                  {product.sizes?.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                      {product.sizes.slice(0, 4).map(s => <span key={s} className="bg-white/90 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-medium">{s}</span>)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {product.code && <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.code}</p>}
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  {product.colors?.length > 0 && <p className="text-xs text-gray-400 mb-1">{product.colors.length} cor{product.colors.length > 1 ? "es" : ""}</p>}
                  <p className="text-base font-bold text-[#8C2F39]">R$ {product.base_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-500">PIX: R$ {(product.pix_price ?? product.base_price * 0.9).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openEdit(product)} className="flex-1 flex items-center justify-center gap-1 text-sm bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700">
                      <Edit size={14} /> Editar
                    </button>
                    <button onClick={() => toggleActive(product)} className="p-2 border rounded-lg hover:bg-gray-50">
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
