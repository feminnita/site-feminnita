"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const phoneNumber = "5521999999999"; // Número configurável
  const message = "Olá! Vim do site e gostaria de mais informações.";

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110 z-50 flex items-center justify-center"
      aria-label="Abrir WhatsApp"
    >
      <MessageCircle size={28} />
    </button>
  );
}
