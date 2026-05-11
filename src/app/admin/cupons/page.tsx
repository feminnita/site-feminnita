"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, Save, X, Tag, Percent, DollarSign } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

const emptyCoupon = (): Omit<Coupon, "id" | "created_at" | "used_count"> => ({
  code: "",
  type: "percentage",
  value: 10,
  min_order_value: 0,
  max_uses: null,
  active: true,
  expires_at: null,
});

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<(Omit<Coupon, "id" | "created_at" | "used_count"> & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !editing.code) return;
    setSaving(true);

    const payload = {
      code: editing.code.toUpperCase().trim(),
      type: editing.type,
      value: editing.value,
      min_order_value: editing.min_order_value,
      max_uses: editing.max_uses || null,
      active: editing.active,
      expires_at: editing.expires_at || null,
    };

    if (editing.id) {
      await supabase.from("coupons").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("coupons").insert({ ...payload, used_count: 0 });
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    load();
  };

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from("coupons").update({ active: !coupon.active }).eq("id", coupon.id);
    load();
  };

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupons de Desconto</h1>
          <p className="text-gray-500 mt-1">{coupons.length} cupons cadastrados</p>
        </div>
        <button
          onClick={() => setEditing(emptyCoupon())}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#7a2832]"
        >
          <Plus size={18} />
          Novo Cupom
        </button>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing.id ? "Editar" : "Novo"} Cupom</h2>
              <button onClick={() => setEditing(null)}><X size={22} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código do cupom *</label>
                <input
                  type="text"
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg font-mono uppercase focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder="FEMINNITA10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de desconto</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, type: "percentage" })}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-sm ${
                        editing.type === "percentage" ? "bg-[#8C2F39] text-white border-[#8C2F39]" : "border-gray-200"
                      }`}
                    >
                      <Percent size={14} /> %
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, type: "fixed" })}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-sm ${
                        editing.type === "fixed" ? "bg-[#8C2F39] text-white border-[#8C2F39]" : "border-gray-200"
                      }`}
                    >
                      <DollarSign size={14} /> R$
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor ({editing.type === "percentage" ? "%" : "R$"})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={editing.type === "percentage" ? "1" : "0.01"}
                    max={editing.type === "percentage" ? "100" : undefined}
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.min_order_value}
                    onChange={(e) => setEditing({ ...editing, min_order_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. de usos</label>
                  <input
                    type="number"
                    min="1"
                    value={editing.max_uses || ""}
                    onChange={(e) => setEditing({ ...editing, max_uses: parseInt(e.target.value) || null })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de expiração</label>
                <input
                  type="datetime-local"
                  value={editing.expires_at ? editing.expires_at.slice(0, 16) : ""}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="w-4 h-4 accent-[#8C2F39]"
                />
                <span className="text-sm font-medium text-gray-700">Cupom ativo</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editing.code}
                  className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7a2832] disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setEditing(null)} className="px-5 py-2 border rounded-lg hover:bg-gray-50 text-sm">
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
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <Tag size={56} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhum cupom cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Código", "Tipo", "Valor", "Usos", "Validade", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((c) => (
                <tr key={c.id} className={`hover:bg-gray-50 ${isExpired(c) ? "opacity-50" : ""}`}>
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {c.type === "percentage" ? `${c.value}% off` : `R$ ${c.value.toFixed(2).replace(".", ",")} off`}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {c.min_order_value > 0 ? `Mín. R$ ${c.min_order_value.toFixed(2).replace(".", ",")}` : "Sem mínimo"}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "Sem prazo"}
                    {isExpired(c) && <span className="ml-1 text-red-500 text-xs">(expirado)</span>}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleActive(c)}>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        c.active && !isExpired(c) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {c.active && !isExpired(c) ? "Ativo" : "Inativo"}
                      </span>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing({ ...c })} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit size={15} className="text-gray-600" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg">
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
