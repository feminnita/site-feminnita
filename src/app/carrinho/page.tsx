"use client";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useCart } from "@/lib/cart";

export default function CarrinhoPage() {
  const { items, total, removeItem, updateQty } = useCart();

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const frete = total >= 299 ? 0 : 19.9;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <h1 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-600 mb-8">
          Meu Carrinho
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto mb-4 text-gray-300" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <p className="text-gray-400 mb-6">Seu carrinho está vazio</p>
            <Link
              href="/"
              className="inline-block text-[11px] uppercase tracking-[0.3em] border px-10 py-3 hover:bg-gray-800 hover:text-white transition-colors"
              style={{ borderColor: "#333", color: "#333" }}
            >
              Continuar Comprando
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Items */}
            <div className="md:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4">
                  <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] text-gray-800 mb-1">{item.name}</p>
                    <p className="text-[12px] text-gray-400">
                      Tamanho: {item.size}{item.color ? ` · ${item.color}` : ""}
                    </p>
                    <p className="text-[11px] text-gray-400 mb-2">
                      {fmt(item.pixPrice)} via PIX · {fmt(item.price)} no cartão
                    </p>
                    <p className="text-[15px] font-bold" style={{ color: "#8C2F39" }}>
                      {fmt(item.pixPrice * item.qty)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div className="flex items-center border border-gray-200 text-sm">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50">−</button>
                      <span className="w-8 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="border border-gray-100 p-6">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-700 mb-4">
                  Resumo
                </h2>
                <div className="space-y-2 text-[13px] text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{fmt(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span className={frete === 0 ? "text-green-600 font-semibold" : ""}>
                      {frete === 0 ? "Grátis" : fmt(frete)}
                    </span>
                  </div>
                  {total < 299 && (
                    <p className="text-[11px] text-gray-400">
                      Faltam {fmt(299 - total)} para frete grátis
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between font-bold text-gray-800">
                    <span>Total</span>
                    <span>{fmt(total + frete)}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full text-center text-white text-[12px] uppercase tracking-[0.2em] py-4 font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "#8C2F39" }}
                >
                  Finalizar Compra
                </Link>
                <Link
                  href="/"
                  className="block text-center text-[11px] text-gray-400 mt-3 hover:text-gray-600 transition-colors"
                >
                  Continuar comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
