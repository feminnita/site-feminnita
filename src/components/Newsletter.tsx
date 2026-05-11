"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }

    // Save to localStorage (in production, send to backend)
    const subscribers = JSON.parse(localStorage.getItem("newsletter") || "[]");
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem("newsletter", JSON.stringify(subscribers));
    }

    setStatus("success");
    setEmail("");

    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <div className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Mail size={48} className="mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Inscreva-se na Newsletter</h3>
          <p className="text-gray-400 mb-6">
            Receba novidades, promoções exclusivas e dicas de treino!
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              className="flex-1 px-4 py-3 rounded-lg text-black"
              required
            />
            <button
              type="submit"
              className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700"
            >
              Inscrever
            </button>
          </form>

          {status === "success" && (
            <p className="text-green-400 mt-4">
              ✓ Inscrição realizada com sucesso!
            </p>
          )}
          {status === "error" && (
            <p className="text-red-400 mt-4">
              ✗ Por favor, insira um e-mail válido
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
