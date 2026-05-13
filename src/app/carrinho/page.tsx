"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const fmt = (v: number) => v.toFixed(2).replace(".", ",");

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cep, setCep] = useState("");

  useEffect(() => {
    const load = () => setCartItems(JSON.parse(localStorage.getItem("cart") || "[]"));
    load();
    window.addEventListener("cartUpdated", load);
    return () => window.removeEventListener("cartUpdated", load);
  }, []);

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...cartItems];
    updated[idx].quantity = qty;
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const remove = (idx: number) => {
    const updated = cartItems.filter((_, i) => i !== idx);
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const subtotal = cartItems.reduce((s, i) => s + i.pixPrice * i.quantity, 0);
  const frete = subtotal >= 299 ? 0 : 19.90;
  const total = subtotal + frete;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[1400px] mx-auto px-6 py-32 text-center">
          <ShoppingBag size={48} strokeWidth={1} className="mx-auto text-gray-200 mb-6" />
          <p className="text-[13px] text-gray-500 tracking-wide mb-8">Seu carrinho está vazio</p>
          <Link
            href="/"
            className="inline-block border border-gray-800 text-gray-800 text-[11px] tracking-widest uppercase px-10 py-3 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Continuar comprando
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <h1 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-700 mb-10">
          Carrinho de Compras
        </h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Itens */}
          <div className="lg:col-span-2">
            {/* Cabeçalho da tabela */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-gray-100 pb-3 mb-4">
              {["Produto", "Preço", "Quantidade", "Total", ""].map((h) => (
                <p key={h} className="text-[10px] uppercase tracking-widest text-gray-400">{h}</p>
              ))}
            </div>

            {cartItems.map((item, idx) => (
              <div
                key={`${item.id}-${item.selectedColor}-${idx}`}
                className="grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center border-b border-gray-100 py-5"
              >
                {/* Produto */}
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 shrink-0 bg-[#f5f0eb]" style={{ aspectRatio: "2/3" }}>
                    <Image src={item.images?.[0] || "/placeholder.jpg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400 uppercase tracking-wide">{item.code}</p>
                    <p className="text-[13px] text-gray-800 mt-0.5">{item.name}</p>
                    {item.selectedColor && (
                      <p className="text-[11px] text-gray-400 mt-1">Cor: {item.selectedColor}</p>
                    )}
                    {item.selectedSize && (
                      <p className="text-[11px] text-gray-400">Tam: {item.selectedSize}</p>
                    )}
                  </div>
                </div>

                {/* Preço unit */}
                <p className="text-[13px] text-gray-700">R$ {fmt(item.pixPrice)}</p>

                {/* Quantidade */}
                <div className="flex items-center border border-gray-200 w-fit">
                  <button
                    onClick={() => updateQty(idx, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >−</button>
                  <span className="w-8 text-center text-[13px]">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(idx, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >+</button>
                </div>

                {/* Total linha */}
                <p className="text-[13px] font-medium text-gray-800">R$ {fmt(item.pixPrice * item.quantity)}</p>

                {/* Remover */}
                <button onClick={() => remove(idx)} className="text-gray-300 hover:text-[#8C2F39] transition-colors">
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
            ))}

            <div className="mt-8">
              <Link
                href="/"
                className="text-[11px] uppercase tracking-widest text-gray-500 hover:text-[#8C2F39] transition-colors"
              >
                ← Continuar comprando
              </Link>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="border border-gray-100 p-6 sticky top-28">
              <h2 className="text-[12px] uppercase tracking-widest text-gray-700 mb-6">Resumo do Pedido</h2>

              {/* Calcular frete */}
              <div className="mb-5">
                <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">Calcular frete</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="00000-000"
                    className="flex-1 border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-gray-400"
                  />
                  <button className="border border-gray-300 px-3 py-2 text-[11px] uppercase tracking-wide hover:bg-gray-50 transition-colors">
                    Ok
                  </button>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-5">
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Frete</span>
                  <span className={frete === 0 ? "text-green-600" : ""}>
                    {frete === 0 ? "Grátis" : `R$ ${fmt(frete)}`}
                  </span>
                </div>
                {frete > 0 && (
                  <p className="text-[10px] text-gray-400">Frete grátis acima de R$ 299,00</p>
                )}
              </div>

              <div className="border-t border-gray-100 mt-5 pt-5">
                <div className="flex justify-between">
                  <span className="text-[12px] font-medium text-gray-800">Total</span>
                  <span className="text-[16px] font-medium text-gray-900">R$ {fmt(total)}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">via PIX ou Boleto</p>
              </div>

              <Link href="/checkout">
                <button className="w-full mt-6 bg-gray-900 text-white text-[11px] uppercase tracking-widest py-4 hover:bg-[#8C2F39] transition-colors duration-300">
                  Finalizar Compra
                </button>
              </Link>

              <div className="mt-4 text-center">
                <p className="text-[10px] text-gray-400">Pagamento 100% seguro</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
