"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useCep } from "@/hooks/useCep";
import { trackBeginCheckout, trackAddShippingInfo, trackAddPaymentInfo, trackPurchase } from "@/lib/analytics";
import {
  CreditCard, Barcode, QrCode, Truck, Lock,
  Loader2, AlertCircle, ChevronDown, ChevronUp, Check, ShieldCheck,
} from "lucide-react";
import { getAffiliateCode, clearAffiliateCode } from "@/lib/affiliate";

export default function CheckoutPage() {
  const router = useRouter();
  const { lookup, loading: cepLoading } = useCep();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [error, setError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const abandonedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", cpf: "", phone: "",
    cep: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
    installments: "1",
    card_number: "", card_expiry: "", card_cvv: "", card_name: "",
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) { router.push("/carrinho"); return; }
    setCartItems(cart);
    // GA4: begin_checkout
    const items = cart.map((i: any) => ({ id: i.id, name: i.name, category: i.category, price: i.pixPrice ?? i.price, quantity: i.quantity }));
    const val = cart.reduce((s: number, i: any) => s + (i.pixPrice ?? i.price) * i.quantity, 0);
    trackBeginCheckout(items, val);
  }, [router]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectPayment = (method: string) => {
    setPaymentMethod(method);
    const items = cartItems.map((i: any) => ({ id: i.id, name: i.name, price: i.pixPrice ?? i.price, quantity: i.quantity }));
    trackAddPaymentInfo(items, total, method === "pix" ? "PIX" : method === "card" ? "Cartão de Crédito" : "Boleto");
  };

  const handleEmailBlur = (email: string) => {
    if (!email.includes("@")) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!cart.length) return;
    if (abandonedTimer.current) clearTimeout(abandonedTimer.current);
    abandonedTimer.current = setTimeout(() => {
      fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: form.name, items: cart, total: subtotal }),
      }).catch(() => {});
    }, 10 * 60 * 1000);
  };

  const handleCepBlur = async () => {
    const cep = form.cep.replace(/\D/g, "");
    const addr = await lookup(cep);
    if (addr) {
      setForm((f) => ({
        ...f,
        street: addr.logradouro || f.street,
        neighborhood: addr.bairro || f.neighborhood,
        city: addr.cidade,
        state: addr.uf,
      }));
      calculateShipping(cep);
    }
  };

  const calculateShipping = async (cep: string) => {
    setIsCalculatingShipping(true);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, products: cartItems }),
      });
      const data = await res.json();
      setShippingOptions(data.options || []);
      if (data.options?.[0]) {
        setSelectedShipping(data.options[0]);
        // GA4: add_shipping_info on first auto-selection
        const items = cartItems.map((i: any) => ({ id: i.id, name: i.name, price: i.pixPrice ?? i.price, quantity: i.quantity }));
        trackAddShippingInfo(items, subtotal, data.options[0].name);
      }
    } catch {
      setShippingOptions([]);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const subtotal = cartItems.reduce((s, i) => s + (i.pixPrice || i.price || 0) * i.quantity, 0);
  const shippingCost = selectedShipping?.price || 0;
  const discount = paymentMethod === "pix" ? subtotal * 0.1 : 0;
  const total = subtotal + shippingCost - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipping) { setError("Selecione uma opção de frete."); return; }
    setError("");
    setIsProcessing(true);

    try {
      const payload = {
        customer: {
          name: form.name, email: form.email,
          cpf: form.cpf.replace(/\D/g, ""), phone: form.phone,
          address: {
            cep: form.cep, street: form.street, number: form.number,
            complement: form.complement, neighborhood: form.neighborhood,
            city: form.city, state: form.state,
          },
        },
        items: cartItems,
        paymentMethod,
        selectedShipping,
        subtotal, shippingCost, discount, total,
        affiliate_code: getAffiliateCode() ?? undefined,
        installments: form.installments,
        card: paymentMethod === "card" ? {
          number: form.card_number.replace(/\s/g, ""),
          expiry: form.card_expiry,
          cvv: form.card_cvv,
          name: form.card_name,
        } : undefined,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar pedido");

      const analyticsItems = cartItems.map((i: any) => ({
        id: i.id, name: i.name, category: i.category,
        price: i.pixPrice ?? i.price, quantity: i.quantity,
      }));
      // metaEventId = id do pedido (orders.id, = event_id do CAPI) p/ dedup; metaPaid=true só p/ cartão aprovado na hora.
      // Pix/boleto: o Meta Purchase sai do CAPI (webhook Asaas) quando o pagamento é confirmado — evita contar Pix não pago.
      trackPurchase(data.orderNumber, analyticsItems, total, shippingCost, discount, {
        metaEventId: data.orderId,
        metaPaid: data.status === "paid",
      });

      localStorage.removeItem("cart");
      localStorage.removeItem("abandonedCart");
      clearAffiliateCode();
      window.dispatchEvent(new Event("cartUpdated"));

      const params = new URLSearchParams({ id: data.orderId, method: paymentMethod });
      if (data.pixQrCode) params.set("pix", encodeURIComponent(data.pixQrCode));
      if (data.pixQrCodeBase64) params.set("pixImg", encodeURIComponent(data.pixQrCodeBase64));
      if (data.boletoUrl) params.set("boleto", encodeURIComponent(data.boletoUrl));
      router.push(`/pedido-confirmado?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || "Erro ao processar pedido. Tente novamente.");
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) return null;

  const inputClass = "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8C2F39] focus:border-transparent text-base";

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-8">
      <Header />

      {/* Trust bar */}
      <div className="bg-[#8C2F39] text-white text-xs py-2 text-center flex items-center justify-center gap-4 px-4">
        <span className="flex items-center gap-1"><ShieldCheck size={13} /> Compra 100% segura</span>
        <span className="flex items-center gap-1"><Check size={13} /> Sem cadastro obrigatório</span>
        <span className="flex items-center gap-1"><Truck size={13} /> Frete calculado no CEP</span>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-light mb-6 flex items-center gap-2">
          <Lock size={18} className="text-green-600" /> Finalizar Compra
        </h1>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* Mobile: collapsible summary */}
        <div className="md:hidden bg-white rounded-xl border mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 font-medium text-sm"
          >
            <span>Ver resumo do pedido ({cartItems.length} {cartItems.length === 1 ? "item" : "itens"})</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#8C2F39]">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>
          {summaryOpen && (
            <div className="px-4 pb-4 border-t divide-y text-sm">
              {cartItems.map((item, i) => (
                <div key={i} className="flex justify-between py-2">
                  <span className="text-gray-700">{item.quantity}× {item.name}</span>
                  <span className="font-medium">R$ {((item.pixPrice || item.price) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: form */}
            <div className="lg:col-span-3 space-y-4">

              {/* Dados pessoais */}
              <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-4">1. Dados pessoais</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input name="name" placeholder="Nome completo *" required value={form.name}
                    onChange={(e) => set("name", e.target.value)} className={inputClass} />
                  <input name="email" type="email" placeholder="E-mail *" required value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    onBlur={(e) => handleEmailBlur(e.target.value)} className={inputClass} />
                  <input name="cpf" placeholder="CPF *" required value={form.cpf}
                    onChange={(e) => set("cpf", e.target.value.replace(/\D/g, "").slice(0, 11))} className={inputClass} />
                  <input name="phone" type="tel" placeholder="WhatsApp *" required value={form.phone}
                    onChange={(e) => set("phone", e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-4">2. Endereço de entrega</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="relative sm:col-span-2">
                    <input name="cep" placeholder="CEP *" required value={form.cep}
                      onChange={(e) => set("cep", e.target.value.replace(/\D/g, "").slice(0, 8))}
                      onBlur={handleCepBlur}
                      className={inputClass + " pr-10"} />
                    {cepLoading && <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-gray-400" />}
                  </div>
                  <input name="street" placeholder="Rua *" required value={form.street}
                    onChange={(e) => set("street", e.target.value)} className={`${inputClass} sm:col-span-2`} />
                  <input name="number" placeholder="Número *" required value={form.number}
                    onChange={(e) => set("number", e.target.value)} className={inputClass} />
                  <input name="complement" placeholder="Complemento" value={form.complement}
                    onChange={(e) => set("complement", e.target.value)} className={inputClass} />
                  <input name="neighborhood" placeholder="Bairro *" required value={form.neighborhood}
                    onChange={(e) => set("neighborhood", e.target.value)} className={inputClass} />
                  <input name="city" placeholder="Cidade *" required value={form.city}
                    onChange={(e) => set("city", e.target.value)} className={inputClass} />
                </div>

                {/* Frete */}
                {isCalculatingShipping && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={14} className="animate-spin" /> Calculando frete...
                  </div>
                )}
                {shippingOptions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium text-sm flex items-center gap-2"><Truck size={16} /> Opções de frete</h3>
                    {shippingOptions.map((opt) => (
                      <label key={opt.id} className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedShipping?.id === opt.id ? "border-[#8C2F39] bg-rose-50" : "border-gray-200"
                      }`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shipping" checked={selectedShipping?.id === opt.id}
                            onChange={() => setSelectedShipping(opt)} className="accent-[#8C2F39]" />
                          <div>
                            <p className="text-sm font-medium">{opt.name}</p>
                            <p className="text-xs text-gray-500">{opt.delivery_time}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-sm text-[#8C2F39]">
                          {opt.price === 0 ? "Grátis" : `R$ ${opt.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        </p>
                      </label>
                    ))}
                  </div>
                )}
                {!isCalculatingShipping && shippingOptions.length === 0 && form.cep.length === 8 && (
                  <p className="mt-3 text-xs text-amber-600">Nenhuma opção de frete disponível para este CEP.</p>
                )}
              </div>

              {/* Pagamento */}
              <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-4">3. Forma de pagamento</h2>

                {/* PIX destaque */}
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer mb-3 transition-all ${
                  paymentMethod === "pix" ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}>
                  <input type="radio" name="payment" value="pix" checked={paymentMethod === "pix"}
                    onChange={() => selectPayment("pix")} className="accent-green-600" />
                  <QrCode size={22} className={paymentMethod === "pix" ? "text-green-600" : "text-gray-400"} />
                  <div className="flex-1">
                    <p className="font-semibold">PIX</p>
                    <p className="text-xs text-green-600 font-semibold">10% DE DESCONTO — Aprovação instantânea</p>
                  </div>
                  {paymentMethod === "pix" && discount > 0 && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold">
                      -R$ {discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </label>

                {[
                  { id: "card", Icon: CreditCard, title: "Cartão de crédito", subtitle: "Parcelamento em até 10x" },
                  { id: "boleto", Icon: Barcode, title: "Boleto bancário", subtitle: "Aprovação em até 2 dias úteis" },
                ].map(({ id, Icon, title, subtitle }) => (
                  <label key={id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer mb-3 transition-all ${
                    paymentMethod === id ? "border-[#8C2F39] bg-rose-50" : "border-gray-200"
                  }`}>
                    <input type="radio" name="payment" value={id} checked={paymentMethod === id}
                      onChange={() => selectPayment(id)} className="accent-[#8C2F39]" />
                    <Icon size={22} className={paymentMethod === id ? "text-[#8C2F39]" : "text-gray-400"} />
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-xs text-gray-500">{subtitle}</p>
                    </div>
                  </label>
                ))}

                {/* Campos cartão */}
                {paymentMethod === "card" && (
                  <div className="mt-2 space-y-3">
                    <input placeholder="Número do cartão *" value={form.card_number}
                      onChange={(e) => set("card_number", e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))}
                      className={inputClass} inputMode="numeric" />
                    <input placeholder="Nome no cartão *" value={form.card_name}
                      onChange={(e) => set("card_name", e.target.value.toUpperCase())} className={inputClass} />
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="MM/AA *" value={form.card_expiry}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          set("card_expiry", v.length >= 2 ? v.slice(0, 2) + "/" + v.slice(2, 4) : v);
                        }} className={inputClass} inputMode="numeric" maxLength={5} />
                      <input placeholder="CVV *" value={form.card_cvv}
                        onChange={(e) => set("card_cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className={inputClass} inputMode="numeric" />
                    </div>
                    <select value={form.installments} onChange={(e) => set("installments", e.target.value)}
                      className={inputClass}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={String(n)}>
                          {n}× de R$ {(total / n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Right: summary (desktop) */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="bg-white rounded-xl border p-5 sticky top-4 space-y-4">
                <h2 className="font-semibold">Resumo</h2>
                <div className="space-y-2 max-h-52 overflow-y-auto text-sm divide-y">
                  {cartItems.map((item, i) => (
                    <div key={i} className="flex justify-between pt-2">
                      <span className="text-gray-700 truncate pr-2">{item.quantity}× {item.name}</span>
                      <span className="font-medium shrink-0">R$ {((item.pixPrice || item.price) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frete</span>
                    <span>{shippingCost === 0 && selectedShipping ? "Grátis" : selectedShipping ? `R$ ${shippingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Desconto PIX</span>
                      <span>- R$ {discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-[#8C2F39]">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button type="submit" disabled={isProcessing || !selectedShipping}
                  className="w-full bg-[#8C2F39] text-white py-4 rounded-xl font-semibold hover:bg-[#7a2832] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Processando...</> : <><Lock size={15} /> Finalizar Pedido</>}
                </button>

                <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                  <Lock size={10} /> Pagamento 100% seguro e criptografado
                </p>
              </div>
            </div>
          </div>

          {/* Mobile sticky CTA */}
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t p-4 shadow-lg"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <button type="submit" disabled={isProcessing || !selectedShipping}
              className="w-full bg-[#8C2F39] text-white py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              {isProcessing
                ? <><Loader2 size={18} className="animate-spin" /> Processando...</>
                : <><Lock size={15} /> Finalizar — R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</>}
            </button>
            {!selectedShipping && (
              <p className="text-xs text-center text-amber-600 mt-1">Digite o CEP para calcular o frete</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
