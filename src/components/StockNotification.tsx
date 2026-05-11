"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

interface StockNotificationProps {
  productId: string;
  productName: string;
}

export function StockNotification({ productId, productName }: StockNotificationProps) {
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }

    // Save to localStorage (in production, save to backend)
    const notifications = JSON.parse(localStorage.getItem("stockNotifications") || "[]");

    const notification = {
      productId,
      productName,
      email,
      date: new Date().toISOString(),
      notified: false,
    };

    notifications.push(notification);
    localStorage.setItem("stockNotifications", JSON.stringify(notifications));

    setStatus("success");
    setEmail("");

    setTimeout(() => {
      setIsOpen(false);
      setStatus("idle");
    }, 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2"
      >
        <Bell size={20} />
        Produto Esgotado - Avise-me quando chegar
      </button>
    );
  }

  return (
    <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
      <h3 className="font-bold mb-2 flex items-center gap-2">
        <Bell size={20} className="text-blue-600" />
        Avise-me quando voltar ao estoque
      </h3>
      <p className="text-sm text-gray-700 mb-4">
        Digite seu e-mail e te avisaremos assim que o produto {productName} estiver disponível novamente!
      </p>

      {status === "success" ? (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-green-800 text-center">
          ✓ Cadastrado com sucesso! Você receberá um e-mail quando o produto voltar ao estoque.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu-email@exemplo.com"
            className="w-full px-4 py-3 border rounded-lg"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Cadastrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setEmail("");
                setStatus("idle");
              }}
              className="px-6 py-3 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
          {status === "error" && (
            <p className="text-red-600 text-sm">Por favor, insira um e-mail válido</p>
          )}
        </form>
      )}
    </div>
  );
}
