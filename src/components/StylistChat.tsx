"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Send, X, Minimize2, Maximize2, ShoppingCart } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

type Product = { id: string; name: string; pix_price?: number; pixPrice?: number; images: string[]; category: string };

function parseProductRefs(text: string, products: Product[]) {
  const parts: (string | Product)[] = [];
  const regex = /\[id:([^\]]+)\]/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const product = products.find((p) => p.id === match[1]);
    if (product) parts.push(product);
    else parts.push(match[0]);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function addToCart(product: Product) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((i: any) => i.id === product.id);
  if (idx > -1) cart[idx].quantity += 1;
  else cart.push({ ...product, pixPrice: product.pix_price ?? product.pixPrice, selectedSize: "", selectedColor: "", quantity: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

function ProductChip({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const price = product.pix_price ?? product.pixPrice ?? 0;

  return (
    <div className="flex items-center gap-2 bg-[#FAF6F2] border rounded-xl p-2 my-1 max-w-xs">
      <Link href={`/produto/${product.id}`}>
        <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          {product.images?.[0] && (
            <Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-cover" />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium line-clamp-2">{product.name}</p>
        <p className="text-xs text-[#8C2F39] font-bold mt-0.5">R$ {price.toFixed(2).replace(".", ",")}</p>
      </div>
      <button
        onClick={() => { addToCart(product); setAdded(true); setTimeout(() => setAdded(false), 1800); }}
        className={`shrink-0 p-1.5 rounded-lg transition-colors ${added ? "bg-green-500 text-white" : "bg-[#8C2F39] text-white hover:bg-[#7a2832]"}`}
      >
        <ShoppingCart size={13} />
      </button>
    </div>
  );
}

function MessageContent({ content, products }: { content: string; products: Product[] }) {
  const parts = parseProductRefs(content, products);
  return (
    <div>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>
        ) : (
          <ProductChip key={i} product={part} />
        )
      )}
    </div>
  );
}

export function StylistChat({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Oi! Sou a Nita, sua estilista virtual ✨ Me conta: qual é a ocasião? Academia, yoga, corrida ou algo casual? E tem alguma cor favorita?" },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          products: products.slice(0, 60).map((p) => ({
            id: p.id, name: p.name, category: p.category,
            price: p.pix_price ?? p.pixPrice ?? 0,
          })),
          history: newMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.text) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: (updated[updated.length - 1].content || "") + data.text,
              };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Ops, tive um probleminha. Pode repetir?" };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 bg-gradient-to-br from-[#8C2F39] to-[#C41E3A] text-white rounded-full p-4 shadow-xl hover:scale-105 transition-transform"
          aria-label="Estilista virtual"
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`fixed z-50 right-4 md:right-6 bg-white rounded-2xl shadow-2xl border flex flex-col transition-all duration-200
            ${minimized ? "bottom-4 h-14 w-72" : "bottom-4 h-[480px] w-80 md:w-96"}`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#8C2F39] to-[#C41E3A] rounded-t-2xl">
            <Sparkles size={16} className="text-white" />
            <p className="text-white font-semibold text-sm flex-1">Nita — Estilista Virtual</p>
            <button onClick={() => setMinimized((v) => !v)} className="text-white/70 hover:text-white">
              {minimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
            </button>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white ml-1">
              <X size={15} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] text-sm rounded-2xl px-3.5 py-2.5 ${
                        m.role === "user"
                          ? "bg-[#8C2F39] text-white rounded-br-sm"
                          : "bg-[#FAF6F2] text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <MessageContent content={m.content || (streaming && i === messages.length - 1 ? "▋" : "")} products={products} />
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Ex: quero um conjunto rosa tamanho M"
                  className="flex-1 text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
                  disabled={streaming}
                />
                <button
                  onClick={send}
                  disabled={streaming || !input.trim()}
                  className="bg-[#8C2F39] text-white p-2 rounded-xl hover:bg-[#7a2832] transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
