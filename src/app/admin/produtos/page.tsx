"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  ChevronLeft,
  Star,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";

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
  images: any;
  created_at: string;
};

type Category = { id: string; name: string };

const emptyProduct = (): Omit<Product, "id" | "created_at"> => ({
  name: "",
  slug: "",
  description: "",
  code: "",
  category_id: null,
  base_price: 0,
  pix_price: null,
  sale_price: null,
  stock: 0,
  active: true,
  featured: false,
  is_new: true,
  is_bestseller: false,
  images: [],
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<(Omit<Product, "id" | "created_at"> & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagesInput, setImagesInput] = useState("");

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").eq("active", true).order("name"),
    ]);
    setProducts(prodRes.data || []);
    setCategories(catRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(emptyProduct());
    setImagesInput("");
  };

  const openEdit = (p: Product) => {
    setEditing({ ...p });
    const imgs = Array.isArray(p.images) ? p.images : [];
    setImagesInput(imgs.join("\n"));
  };

  const handleNameChange = (name: string) => {
    if (!editing) return;
    setEditing({ ...editing, name, slug: slugify(name) });
  };

  const handleSave = async () => {
    if (!editing || !editing.name) return;
    setSaving(true);

    const images = imagesInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const pixPrice = editing.pix_price ?? editing.base_price * 0.9;

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
    };

    if (editing.id) {
      await supabase.from("products").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("products").insert(payload);
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

  if (editing !== null) {
    const pixPreview = editing.pix_price ?? editing.base_price * 0.9;
    return (
      <div className="p-8">
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft size={18} />
          Voltar para lista
        </button>

        <div className="max-w-3xl bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold mb-6">
            {editing.id ? "Editar Produto" : "Novo Produto"}
          </h2>

          <div className="space-y-5">
            {/* Name */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39] focus:border-[#8C2F39]"
                  placeholder="Ex: Top Fitness Refúgio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  value={editing.code || ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder="FEM-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={editing.category_id || ""}
                  onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                >
                  <option value="">— Sem categoria —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editing.base_price}
                  onChange={(e) => setEditing({ ...editing, base_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  PIX (10% off): R$ {pixPreview.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Promocional (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editing.sale_price || ""}
                  onChange={(e) => setEditing({ ...editing, sale_price: parseFloat(e.target.value) || null })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder="Deixe vazio se não há promoção"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                <input
                  type="number"
                  min="0"
                  value={editing.stock}
                  onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                placeholder="Descreva o produto..."
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URLs das Imagens (uma por linha)
              </label>
              <textarea
                value={imagesInput}
                onChange={(e) => setImagesInput(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39] font-mono text-sm"
                placeholder={"https://exemplo.com/foto1.jpg\nhttps://exemplo.com/foto2.jpg"}
              />
            </div>

            {/* Flags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Badges e Status</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "active", label: "Ativo", icon: Eye },
                  { key: "featured", label: "Destaque", icon: Star },
                  { key: "is_new", label: "Novidade", icon: Sparkles },
                  { key: "is_bestseller", label: "Mais Vendido", icon: TrendingUp },
                ].map(({ key, label, icon: Icon }) => {
                  const val = editing[key as keyof typeof editing] as boolean;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditing({ ...editing, [key]: !val })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        val
                          ? "bg-[#8C2F39] border-[#8C2F39] text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving || !editing.name}
                className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#7a2832] disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Salvando..." : "Salvar Produto"}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#7a2832]"
        >
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
          <Package size={56} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo Produto" para cadastrar</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => {
            const imgs = Array.isArray(product.images) ? product.images : [];
            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  product.active ? "border-gray-100" : "border-gray-200 opacity-60"
                }`}
              >
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
                    {product.is_new && (
                      <span className="bg-[#8C2F39] text-white text-xs px-2 py-0.5 rounded font-semibold">NOVO</span>
                    )}
                    {product.featured && (
                      <span className="bg-[#D4A956] text-white text-xs px-2 py-0.5 rounded font-semibold">DESTAQUE</span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {product.code && (
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.code}</p>
                  )}
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-base font-bold text-[#8C2F39]">
                    R$ {product.base_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    PIX: R$ {(product.pix_price ?? product.base_price * 0.9).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Estoque: {product.stock}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex-1 flex items-center justify-center gap-1 text-sm bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700"
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActive(product)}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title={product.active ? "Desativar" : "Ativar"}
                    >
                      {product.active ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 border border-red-200 rounded-lg hover:bg-red-50"
                    >
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
