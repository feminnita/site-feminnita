"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Edit, Trash2, X, Save, Copy, Users, DollarSign,
  TrendingUp, UserCheck, Link, Search,
} from "lucide-react";

type Affiliate = {
  id: string;
  name: string;
  email: string;
  code: string;
  commission_pct: number;
  total_clicks: number;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  active: boolean;
  notes: string | null;
  created_at: string;
};

type AffiliateForm = Omit<Affiliate, "id" | "created_at" | "total_clicks" | "total_orders" | "total_revenue" | "total_commission">;

function toCode(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function emptyForm(): AffiliateForm {
  return { name: "", email: "", code: "", commission_pct: 10, notes: "", active: true };
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in">
      {msg}
    </div>
  );
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AfiliadosPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<AffiliateForm>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [codeManual, setCodeManual] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });
    setAffiliates(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm(emptyForm());
    setEditId(null);
    setCodeManual(false);
    setModal(true);
  };

  const openEdit = (a: Affiliate) => {
    setForm({
      name: a.name, email: a.email, code: a.code,
      commission_pct: a.commission_pct, notes: a.notes ?? "", active: a.active,
    });
    setEditId(a.id);
    setCodeManual(true);
    setModal(true);
  };

  const handleNameChange = (v: string) => {
    setForm(f => ({ ...f, name: v, ...(!codeManual ? { code: toCode(v) } : {}) }));
  };

  const save = async () => {
    if (!form.name || !form.email || !form.code) return;
    setSaving(true);
    if (editId) {
      await supabase.from("affiliates").update(form).eq("id", editId);
    } else {
      await supabase.from("affiliates").insert({
        ...form,
        total_clicks: 0, total_orders: 0, total_revenue: 0, total_commission: 0,
      });
    }
    setSaving(false);
    setModal(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir afiliado?")) return;
    await supabase.from("affiliates").delete().eq("id", id);
    load();
  };

  const toggleActive = async (a: Affiliate) => {
    await supabase.from("affiliates").update({ active: !a.active }).eq("id", a.id);
    load();
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`https://feminnita.com.br?ref=${code}`);
    setToast("Link copiado!");
  };

  const filtered = affiliates.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = affiliates.filter(a => a.active).length;
  const totalCommission = affiliates.reduce((s, a) => s + (a.total_commission ?? 0), 0);
  const totalRevenue = affiliates.reduce((s, a) => s + (a.total_revenue ?? 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Afiliados</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie parceiros e comissões</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#8C2F39" }}
        >
          <Plus size={16} /> Novo Afiliado
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Afiliados", value: affiliates.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ativos", value: totalActive, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
          { label: "Comissões Pagas", value: fmt(totalCommission), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Vendas via Afiliados", value: fmt(totalRevenue), icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
          placeholder="Buscar por nome, email ou código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Nenhum afiliado encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nome", "Email", "Código", "Comissão", "Cliques", "Pedidos", "Receita", "Comissão Total", "Status", "Ações"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{a.code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.commission_pct}%</td>
                    <td className="px-4 py-3 text-gray-700">{a.total_clicks ?? 0}</td>
                    <td className="px-4 py-3 text-gray-700">{a.total_orders ?? 0}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(a.total_revenue ?? 0)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(a.total_commission ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {a.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyLink(a.code)} title="Copiar link" className="p-1.5 hover:bg-blue-50 rounded text-blue-500">
                          <Link size={14} />
                        </button>
                        <button onClick={() => openEdit(a)} title="Editar" className="p-1.5 hover:bg-amber-50 rounded text-amber-500">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => toggleActive(a)} title={a.active ? "Desativar" : "Ativar"} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                          {a.active ? <X size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button onClick={() => del(a.id)} title="Excluir" className="p-1.5 hover:bg-red-50 rounded text-red-400">
                          <Trash2 size={14} />
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editId ? "Editar Afiliado" : "Novo Afiliado"}</h2>
              <button onClick={() => setModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código de Afiliado *</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                    value={form.code}
                    onChange={e => { setCodeManual(true); setForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })); }}
                    placeholder="anasilva"
                  />
                  <button
                    onClick={() => { setCodeManual(false); setForm(f => ({ ...f, code: toCode(f.name) })); }}
                    className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 whitespace-nowrap"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Link: feminnita.com.br?ref={form.code || "..."}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Comissão (%)</label>
                <input
                  type="number"
                  min={0} max={100} step={0.5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                  value={form.commission_pct}
                  onChange={e => setForm(f => ({ ...f, commission_pct: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 resize-none"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas internas..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 accent-[#8C2F39]"
                />
                <span className="text-sm text-gray-700">Ativo</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#8C2F39" }}
              >
                <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
