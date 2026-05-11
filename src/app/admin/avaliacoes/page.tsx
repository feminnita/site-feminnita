"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, Check, X, Eye } from "lucide-react";

type Review = {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  created_at: string;
  products: { name: string } | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export default function AdminAvaliacoesPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [selected, setSelected] = useState<Review | null>(null);
  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_reviews")
      .select("*, products(name)")
      .order("created_at", { ascending: false });
    setReviews((data as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await supabase.from("product_reviews").update({ approved: true }).eq("id", id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, approved: true } : r));
    if (selected?.id === id) setSelected((s) => s ? { ...s, approved: true } : null);
  };

  const reject = async (id: string) => {
    await supabase.from("product_reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = reviews.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.approved : r.approved
  );

  const pending = reviews.filter((r) => !r.approved).length;
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Avaliações de Produtos</h1>
        <p className="text-gray-500 mt-1">Modere as avaliações antes de exibi-las na loja</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <Star size={24} className="text-yellow-400 mb-2" />
          <p className="text-2xl font-bold">{reviews.length}</p>
          <p className="text-sm text-gray-500">Total de avaliações</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map((i) => <Star key={i} size={14} className={i <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />)}
          </div>
          <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Média geral</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mb-2">
            <Eye size={14} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-sm text-gray-500">Aguardando aprovação</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold">Avaliações</h3>
            <div className="flex gap-2">
              {(["pending", "approved", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    filter === f ? "bg-[#8C2F39] text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {f === "pending" ? `Pendentes (${pending})` : f === "approved" ? "Aprovadas" : "Todas"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Star size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma avaliação {filter === "pending" ? "pendente" : filter === "approved" ? "aprovada" : ""}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === r.id ? "bg-[#FAF6F2]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Stars rating={r.rating} />
                        {!r.approved && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Pendente</span>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{r.customer_name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.products?.name || "Produto"}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div className="w-80 bg-white rounded-xl border p-5 h-fit sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <Stars rating={selected.rating} />
              {selected.approved ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aprovada</span>
              ) : (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Pendente</span>
              )}
            </div>
            {selected.title && <p className="font-semibold mb-2">{selected.title}</p>}
            <p className="text-sm text-gray-700 mb-4">{selected.body}</p>
            <div className="text-xs text-gray-400 space-y-1 mb-5 pb-4 border-b">
              <p><span className="font-medium text-gray-600">Cliente:</span> {selected.customer_name}</p>
              {selected.customer_email && <p><span className="font-medium text-gray-600">E-mail:</span> {selected.customer_email}</p>}
              <p><span className="font-medium text-gray-600">Produto:</span> {selected.products?.name || "—"}</p>
              <p><span className="font-medium text-gray-600">Data:</span> {new Date(selected.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            {!selected.approved && (
              <div className="flex gap-2">
                <button
                  onClick={() => approve(selected.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  <Check size={15} /> Aprovar
                </button>
                <button
                  onClick={() => reject(selected.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  <X size={15} /> Excluir
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
