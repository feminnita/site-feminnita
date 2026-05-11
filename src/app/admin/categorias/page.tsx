"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, Save, X, Tag, GripVertical, Eye, EyeOff, Package } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  order_index: number;
  created_at: string;
  product_count?: number;
};

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

const emptyCategory = (): Omit<Category, "id" | "created_at"> => ({
  name: "", slug: "", description: null, image_url: null, active: true, order_index: 0,
});

export default function CategoriasPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<(Omit<Category, "id" | "created_at"> & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drag state
  const dragId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, countRes] = await Promise.all([
      supabase.from("categories").select("*").order("order_index"),
      supabase.from("products").select("category_id").not("category_id", "is", null),
    ]);

    const counts: Record<string, number> = {};
    for (const p of countRes.data || []) {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    }

    setCategories((catRes.data || []).map((c: any) => ({ ...c, product_count: counts[c.id] || 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !editing.name) return;
    setSaving(true);
    const payload = {
      name: editing.name,
      slug: editing.slug || slugify(editing.name),
      description: editing.description || null,
      image_url: editing.image_url || null,
      active: editing.active,
      order_index: editing.order_index,
    };
    if (editing.id) {
      await supabase.from("categories").update(payload).eq("id", editing.id);
    } else {
      const maxOrder = Math.max(...categories.map(c => c.order_index), -1);
      await supabase.from("categories").insert({ ...payload, order_index: maxOrder + 1 });
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria? Produtos vinculados ficarão sem categoria.")) return;
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  const toggleActive = async (cat: Category) => {
    await supabase.from("categories").update({ active: !cat.active }).eq("id", cat.id);
    load();
  };

  // Drag & drop reorder
  const onDragStart = (id: string) => { dragId.current = id; };
  const onDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOver(id); };
  const onDrop = async (targetId: string) => {
    setDragOver(null);
    if (!dragId.current || dragId.current === targetId) return;
    const arr = [...categories];
    const fromIdx = arr.findIndex(c => c.id === dragId.current);
    const toIdx = arr.findIndex(c => c.id === targetId);
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    // Reassign order_index
    const updated = arr.map((c, i) => ({ ...c, order_index: i }));
    setCategories(updated);
    dragId.current = null;
    // Persist
    await Promise.all(updated.map(c => supabase.from("categories").update({ order_index: c.order_index }).eq("id", c.id)));
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">{categories.length} categorias · arraste para reordenar</p>
        </div>
        <button
          onClick={() => setEditing(emptyCategory())}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#7a2832]"
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing.id ? "Editar" : "Nova"} Categoria</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text" autoFocus
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value, slug: slugify(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C2F39]"
                  placeholder="Ex: Tops Fitness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#8C2F39]">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">/categoria/</span>
                  <input
                    type="text"
                    value={editing.slug}
                    onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    className="flex-1 px-3 py-2.5 text-sm font-mono focus:outline-none"
                    placeholder="tops-fitness"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={editing.description || ""}
                  onChange={e => setEditing({ ...editing, description: e.target.value || null })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C2F39]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem (URL)</label>
                <input
                  type="text"
                  value={editing.image_url || ""}
                  onChange={e => setEditing({ ...editing, image_url: e.target.value || null })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C2F39]"
                  placeholder="https://..."
                />
                {editing.image_url && (
                  <div className="mt-2 relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={editing.image_url} alt="" fill className="object-cover" onError={() => {}} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                  <input
                    type="number" min="0"
                    value={editing.order_index}
                    onChange={e => setEditing({ ...editing, order_index: parseInt(e.target.value) || 0 })}
                    className="w-24 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C2F39]"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input
                    type="checkbox" checked={editing.active}
                    onChange={e => setEditing({ ...editing, active: e.target.checked })}
                    className="w-4 h-4 accent-[#8C2F39]"
                  />
                  <span className="text-sm font-medium text-gray-700">Categoria ativa</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave} disabled={saving || !editing.name}
                  className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#7a2832] disabled:opacity-50"
                >
                  <Save size={15} /> {saving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setEditing(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <Tag size={48} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhuma categoria ainda</p>
          <p className="text-sm mt-1">Crie categorias para organizar seus produtos</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500">
                <th className="w-10 px-4 py-3"></th>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Slug</th>
                <th className="text-center px-4 py-3">Produtos</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map(cat => (
                <tr
                  key={cat.id}
                  draggable
                  onDragStart={() => onDragStart(cat.id)}
                  onDragOver={e => onDragOver(e, cat.id)}
                  onDrop={() => onDrop(cat.id)}
                  onDragEnd={() => setDragOver(null)}
                  className={`hover:bg-gray-50 transition-colors ${dragOver === cat.id ? "bg-rose-50 border-t-2 border-[#8C2F39]" : ""}`}
                >
                  {/* Drag handle */}
                  <td className="px-4 py-3 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} className="text-gray-300" />
                  </td>

                  {/* Name + image */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {cat.image_url ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Tag size={15} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                        {cat.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{cat.description}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs text-gray-400">{cat.slug}</span>
                  </td>

                  {/* Product count */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package size={13} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{cat.product_count ?? 0}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        cat.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {cat.active ? <><Eye size={11} /> Ativa</> : <><EyeOff size={11} /> Inativa</>}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing({ ...cat })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Edit size={14} className="text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
