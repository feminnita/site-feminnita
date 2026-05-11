"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Save, X, Percent, Calendar } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minValue: number;
  maxDiscount: number;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
}

export default function CuponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = () => {
    const saved = JSON.parse(localStorage.getItem("coupons") || "[]");
    setCoupons(saved);
  };

  const handleNew = () => {
    setEditingCoupon({
      id: Date.now().toString(),
      code: "",
      type: "percentage",
      value: 0,
      minValue: 0,
      maxDiscount: 0,
      expiresAt: "",
      usageLimit: 0,
      usageCount: 0,
      active: true,
    });
    setIsEditing(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon({ ...coupon });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editingCoupon) return;

    const existingIndex = coupons.findIndex((c) => c.id === editingCoupon.id);
    let updated;

    if (existingIndex >= 0) {
      updated = [...coupons];
      updated[existingIndex] = editingCoupon;
    } else {
      updated = [...coupons, editingCoupon];
    }

    setCoupons(updated);
    localStorage.setItem("coupons", JSON.stringify(updated));
    setIsEditing(false);
    setEditingCoupon(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cupom?")) {
      const updated = coupons.filter((c) => c.id !== id);
      setCoupons(updated);
      localStorage.setItem("coupons", JSON.stringify(updated));
    }
  };

  const toggleActive = (id: string) => {
    const updated = coupons.map((c) =>
      c.id === id ? { ...c, active: !c.active } : c
    );
    setCoupons(updated);
    localStorage.setItem("coupons", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!isEditing ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-600">Total de Cupons</div>
                <div className="text-3xl font-bold mt-2">{coupons.length}</div>
              </div>

              <button
                onClick={handleNew}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
              >
                <Plus size={20} />
                Novo Cupom
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Desconto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valor Mínimo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Validade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 font-mono font-bold">{coupon.code}</td>
                      <td className="px-6 py-4 capitalize">{coupon.type === "percentage" ? "Porcentagem" : "Fixo"}</td>
                      <td className="px-6 py-4">
                        {coupon.type === "percentage"
                          ? `${coupon.value}%`
                          : `R$ ${coupon.value.toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4">R$ {coupon.minValue.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {coupon.usageCount}/{coupon.usageLimit || "∞"}
                      </td>
                      <td className="px-6 py-4">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString("pt-BR")
                          : "Sem validade"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(coupon.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            coupon.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {coupon.active ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {coupons.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Percent size={48} className="mx-auto mb-4" />
                  <p>Nenhum cupom cadastrado</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {coupons.find((c) => c.id === editingCoupon?.id)
                  ? "Editar"
                  : "Novo"}{" "}
                Cupom
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingCoupon(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {editingCoupon && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Código do Cupom *
                  </label>
                  <input
                    type="text"
                    value={editingCoupon.code}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="PRIMEIRACOMPRA"
                    className="w-full px-4 py-2 border rounded-lg font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tipo de Desconto *
                    </label>
                    <select
                      value={editingCoupon.type}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          type: e.target.value as "percentage" | "fixed",
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Valor do Desconto *
                    </label>
                    <input
                      type="number"
                      value={editingCoupon.value}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder={editingCoupon.type === "percentage" ? "10" : "50.00"}
                      className="w-full px-4 py-2 border rounded-lg"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Valor Mínimo da Compra (R$)
                    </label>
                    <input
                      type="number"
                      value={editingCoupon.minValue}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          minValue: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-4 py-2 border rounded-lg"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Desconto Máximo (R$)
                    </label>
                    <input
                      type="number"
                      value={editingCoupon.maxDiscount}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          maxDiscount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-4 py-2 border rounded-lg"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      0 = sem limite
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Data de Validade
                    </label>
                    <input
                      type="date"
                      value={editingCoupon.expiresAt}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          expiresAt: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Limite de Usos
                    </label>
                    <input
                      type="number"
                      value={editingCoupon.usageLimit}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          usageLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      0 = ilimitado
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingCoupon.active}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        active: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label className="text-sm">Cupom ativo</label>
                </div>

                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Salvar Cupom
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingCoupon(null);
                    }}
                    className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
