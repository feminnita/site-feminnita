"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Mail, Clock } from "lucide-react";

type AbandonedCart = {
  id: string;
  customer_id: string | null;
  session_id: string;
  items: any[];
  total: number;
  email: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
  recovered: boolean;
};

export default function AdminCarrinhosPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("abandoned_carts")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100);
      setCarts((data as AbandonedCart[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const sendRecoveryEmail = async (cart: AbandonedCart) => {
    if (!cart.email) return;
    setSending(cart.id);
    try {
      await fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cart.email,
          name: cart.name,
          items: cart.items,
          total: cart.total,
          cartUrl: `${window.location.origin}/carrinho`,
        }),
      });
      alert(`E-mail enviado para ${cart.email}`);
    } catch {
      alert("Erro ao enviar e-mail");
    }
    setSending(null);
  };

  const totalValue = carts.filter((c) => !c.recovered).reduce((s, c) => s + c.total, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Carrinhos Abandonados</h1>
        <p className="text-gray-500 mt-1">Recupere vendas enviando e-mails para clientes que não finalizaram a compra</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <ShoppingBag size={24} className="text-orange-500 mb-2" />
          <p className="text-2xl font-bold">{carts.filter((c) => !c.recovered).length}</p>
          <p className="text-sm text-gray-500">Carrinhos abandonados</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <Mail size={24} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{carts.filter((c) => c.email).length}</p>
          <p className="text-sm text-gray-500">Com e-mail para contato</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <Clock size={24} className="text-red-500 mb-2" />
          <p className="text-2xl font-bold">R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500">Valor total recuperável</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold">Carrinhos recentes</h3>
          <span className="text-sm text-gray-500">{carts.length} carrinhos</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : carts.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum carrinho abandonado ainda</p>
            <p className="text-xs text-gray-400 mt-1">Os carrinhos aparecem aqui quando clientes adicionam produtos mas não finalizam</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Itens</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Abandonado em</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{cart.name || "Visitante"}</p>
                      <p className="text-xs text-gray-400">{cart.email || "Sem e-mail"}</p>
                    </td>
                    <td className="px-4 py-3">{cart.items?.length || 0} item(s)</td>
                    <td className="px-4 py-3 font-semibold">R$ {cart.total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(cart.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3">
                      {cart.recovered ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recuperado</span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Abandonado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {cart.email && !cart.recovered && (
                        <button
                          onClick={() => sendRecoveryEmail(cart)}
                          disabled={sending === cart.id}
                          className="text-xs bg-[#8C2F39] text-white px-3 py-1.5 rounded-lg hover:bg-[#7a2832] disabled:opacity-50 transition-colors"
                        >
                          {sending === cart.id ? "Enviando..." : "Enviar e-mail"}
                        </button>
                      )}
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
