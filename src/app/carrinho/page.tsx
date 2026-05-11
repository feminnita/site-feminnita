"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    loadCart();

    const handleCartUpdate = () => loadCart();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedCart = [...cartItems];
    updatedCart[index].quantity = newQuantity;
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.pixPrice * item.quantity,
    0
  );

  const shipping = subtotal >= 299 ? 0 : 15;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b py-4">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-light">feminnita</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <ShoppingBag size={64} className="mx-auto text-gray-300" />
            <h1 className="text-3xl font-light">Seu carrinho está vazio</h1>
            <Link
              href="/"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800"
            >
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-xl font-light">feminnita</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-light mb-8">Carrinho de Compras</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={`${item.id}-${item.selectedColor}-${index}`}
                className="flex gap-4 p-4 bg-white rounded-lg border"
              >
                <div className="relative w-24 h-32 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">Cor: {item.selectedColor}</p>
                  <p className="font-semibold">
                    R$ {item.pixPrice.toFixed(2).replace(".", ",")}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-8 h-8 border rounded hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-8 h-8 border rounded hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <p className="font-semibold">
                    R$ {(item.pixPrice * item.quantity).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 space-y-4 sticky top-4">
              <h2 className="text-xl font-medium">Resumo do Pedido</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>
                    {shipping === 0
                      ? "Grátis"
                      : `R$ ${shipping.toFixed(2).replace(".", ",")}`}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">no PIX (10% OFF)</p>
              </div>

              <Link href="/checkout">
                <button className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800">
                  Finalizar Compra
                </button>
              </Link>

              <Link href="/">
                <button className="w-full border py-3 rounded-lg hover:bg-gray-50">
                  Continuar Comprando
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
