"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Download, Trash2, UserCheck, UserX } from "lucide-react";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  source: string | null;
  created_at: string;
};

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    setSubscribers((data as Subscriber[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("newsletter_subscribers").update({ active: !active }).eq("id", id);
    setSubscribers((prev) => prev.map((s) => s.id === id ? { ...s, active: !active } : s));
  };

  const exportCsv = () => {
    const visible = filtered;
    const csv = ["email,nome,ativo,fonte,data"]
      .concat(visible.map((s) => `${s.email},${s.name || ""},${s.active},${s.source || ""},${new Date(s.created_at).toLocaleDateString("pt-BR")}`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter.csv";
    a.click();
  };

  const filtered = subscribers.filter((s) =>
    filter === "all" ? true : filter === "active" ? s.active : !s.active
  );

  const active = subscribers.filter((s) => s.active).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Assinantes da Newsletter</h1>
          <p className="text-gray-500 mt-1">Gerencie sua lista de e-mails</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <Mail size={24} className="text-[#8C2F39] mb-2" />
          <p className="text-2xl font-bold">{subscribers.length}</p>
          <p className="text-sm text-gray-500">Total de assinantes</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <UserCheck size={24} className="text-green-500 mb-2" />
          <p className="text-2xl font-bold">{active}</p>
          <p className="text-sm text-gray-500">Ativos</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <UserX size={24} className="text-red-400 mb-2" />
          <p className="text-2xl font-bold">{subscribers.length - active}</p>
          <p className="text-sm text-gray-500">Descadastrados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold">Lista de assinantes</h3>
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === f ? "bg-[#8C2F39] text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Mail size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum assinante ainda</p>
            <p className="text-xs text-gray-400 mt-1">Os assinantes aparecem aqui quando clientes se inscrevem pelo site</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">E-mail</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Fonte</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-gray-600">{s.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{s.source || "site"}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      {s.active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Ativo</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(s.id, s.active)}
                        className="text-xs text-gray-500 hover:text-gray-800 underline"
                      >
                        {s.active ? "Desativar" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
