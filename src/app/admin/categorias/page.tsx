"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, Save, X, Tag } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  order_index: number;
  created_at: string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const emptyCategory = (): Omit<Category, "id" | "created_at"> => ({
  name: "",
  slug: "",
  description: null,
  image_url: null,
  active: true,
  order_index: 0,
});

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<(Omit<Category, "id" | "created_at"> & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("order_index");
    setCategories(data || []);
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
      await supabase.from("categories").insert(payload);
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">{categories.length} categorias cadastradas</p>
        </div>
        <button
          onClick={() => setEditing(emptyCategory())}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#7a2832]"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing.id ? "Editar" : "Nova"} Categoria</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: slugify(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder="Ex: Tops Fitness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder="tops-fitness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value || null })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={editing.image_url || ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value || null })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                  <input
                    type="number"
                    min="0"
                    value={editing.order_index}
                    onChange={(e) => setEditing({ ...editing, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                      className="w-4 h-4 accent-[#8C2F39]"
                    />
                    <span className="text-sm font-medium text-gray-700">Categoria ativa</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editing.name}
                  className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7a2832] disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-5 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <Tag size={56} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhuma categoria ainda</p>
          <p className="text-sm mt-1">Crie a primeira categoria para organizar seus produtos</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Ordem</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Slug</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{cat.order_index}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                          <Tag size={14} className="text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{cat.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      cat.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {cat.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing({ ...cat })}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit size={15} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} className="text-red-500" />
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
