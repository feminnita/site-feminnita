"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { CreditCard, Barcode, QrCode, Truck, Lock, Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window { MercadoPago: any; }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [error, setError] = useState("");
  const [mpLoaded, setMpLoaded] = useState(false);
  const cardFormRef = useRef<any>(null);

  const [form, setForm] = useState({
    name: "", email: "", cpf: "", phone: "",
    cep: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
    installments: "1",
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) { router.push("/carrinho"); return; }
    setCartItems(cart);

    // Load Mercado Pago JS SDK
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => setMpLoaded(true);
    document.head.appendChild(script);

    // Abandoned cart tracking
    const abandonedData = { cart, timestamp: new Date().toISOString(), email: "" };
    localStorage.setItem("abandonedCart", JSON.stringify(abandonedData));

    return () => { document.head.removeChild(script); };
  }, [router]);

  // Init MP card form when SDK loads and card method selected
  useEffect(() => {
    if (!mpLoaded || paymentMethod !== "card") return;
    const mpKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!mpKey) return;

    const mp = new window.MercadoPago(mpKey, { locale: "pt-BR" });
    cardFormRef.current = mp.cardForm({
      amount: String(total),
      autoMount: true,
      form: {
        id: "mp-card-form",
        cardholderName: { id: "cardholderName", placeholder: "Nome no Cartão" },
        cardholderEmail: { id: "cardholderEmail", placeholder: "E-mail" },
        cardNumber: { id: "cardNumber", placeholder: "Número do Cartão" },
        expirationDate: { id: "expirationDate", placeholder: "MM/YY" },
        securityCode: { id: "securityCode", placeholder: "CVV" },
        installments: { id: "installments", placeholder: "Parcelas" },
        identificationType: { id: "identificationType" },
        identificationNumber: { id: "identificationNumber", placeholder: "CPF" },
      },
      callbacks: { onFormMounted: (err: any) => { if (err) console.error("MP form error:", err); } },
    });

    return () => { cardFormRef.current?.unmount?.(); };
  }, [mpLoaded, paymentMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "email" && value.includes("@")) {
      const abandoned = JSON.parse(localStorage.getItem("abandonedCart") || "{}");
      localStorage.setItem("abandonedCart", JSON.stringify({ ...abandoned, email: value }));

      // Fire abandoned cart email after 10 min of inactivity (via API)
      const timeout = setTimeout(async () => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (cart.length > 0) {
          await fetch("/api/abandoned-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value, name: form.name, items: cart, total: subtotal }),
          }).catch(() => {});
        }
      }, 10 * 60 * 1000);
      return () => clearTimeout(timeout);
    }
  };

  const handleCepBlur = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade,
          state: data.uf,
        }));
        calculateShipping(cep);
      }
    } catch {}
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
      if (data.options?.[0]) setSelectedShipping(data.options[0]);
    } catch {
      setShippingOptions([]);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || item.pixPrice) * item.quantity, 0);
  const shippingCost = selectedShipping?.price || 0;
  const discount = paymentMethod === "pix" ? subtotal * 0.1 : 0;
  const total = subtotal + shippingCost - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipping) { setError("Selecione uma opção de frete."); return; }
    setError("");
    setIsProcessing(true);

    try {
      let cardToken = null;

      if (paymentMethod === "card" && cardFormRef.current) {
        const formData = cardFormRef.current.getCardFormData();
        cardToken = formData?.token;
        if (!cardToken) throw new Error("Erro ao tokenizar cartão. Verifique os dados.");
      }

      const payload = {
        customer: { ...form, cpf: form.cpf.replace(/\D/g, "") },
        items: cartItems,
        paymentMethod,
        selectedShipping,
        subtotal,
        shippingCost,
        discount,
        total,
        cardToken,
        installments: form.installments,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao processar pedido");

      // GA4 purchase event
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "purchase", {
          transaction_id: data.orderNumber,
          value: total,
          currency: "BRL",
          shipping: shippingCost,
        });
      }

      // FB Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", { value: total, currency: "BRL" });
      }

      localStorage.removeItem("cart");
      localStorage.removeItem("abandonedCart");
      window.dispatchEvent(new Event("cartUpdated"));

      // Encode payment data in URL for confirmation page
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Lock size={20} className="text-green-600" />
          <h1 className="text-3xl font-light">Finalizar Compra</h1>
          <span className="text-sm text-green-600 font-medium ml-2">Ambiente Seguro</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-xl font-medium mb-4">Dados Pessoais</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: "name", placeholder: "Nome Completo *", required: true },
                    { name: "email", type: "email", placeholder: "E-mail *", required: true },
                    { name: "cpf", placeholder: "CPF *", required: true },
                    { name: "phone", placeholder: "Telefone/WhatsApp *", required: true },
                  ].map((field) => (
                    <input
                      key={field.name}
                      name={field.name}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleInputChange}
                      required={field.required}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39] focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-xl font-medium mb-4">Endereço de Entrega</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      name="cep"
                      placeholder="CEP *"
                      value={form.cep}
                      onChange={handleInputChange}
                      onBlur={handleCepBlur}
                      required
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                    />
                  </div>
                  {[
                    { name: "street", placeholder: "Rua *", required: true, col: "md:col-span-2" },
                    { name: "number", placeholder: "Número *", required: true },
                    { name: "complement", placeholder: "Complemento" },
                    { name: "neighborhood", placeholder: "Bairro *", required: true },
                    { name: "city", placeholder: "Cidade *", required: true },
                    { name: "state", placeholder: "UF *", required: true },
                  ].map((field) => (
                    <input
                      key={field.name}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleInputChange}
                      required={field.required}
                      maxLength={field.name === "state" ? 2 : undefined}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39] ${field.col || ""}`}
                    />
                  ))}
                </div>

                {/* Shipping options */}
                {isCalculatingShipping && (
                  <div className="mt-4 flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Calculando opções de frete...
                  </div>
                )}
                {shippingOptions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Truck size={18} /> Escolha o Frete
                    </h3>
                    <div className="space-y-2">
                      {shippingOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedShipping(opt)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            selectedShipping?.id === opt.id
                              ? "border-[#8C2F39] bg-rose-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{opt.name}</p>
                              <p className="text-sm text-gray-500">{opt.company} — {opt.delivery_time}</p>
                            </div>
                            <p className="font-bold text-[#8C2F39]">
                              R$ {opt.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-xl font-medium mb-4">Forma de Pagamento</h2>
                <div className="space-y-3">
                  {[
                    {
                      id: "pix", icon: QrCode,
                      title: "PIX",
                      subtitle: "10% DE DESCONTO — Aprovação imediata",
                      subtitleColor: "text-green-600",
                    },
                    {
                      id: "boleto", icon: Barcode,
                      title: "Boleto Bancário",
                      subtitle: "Aprovação em até 2 dias úteis",
                      subtitleColor: "text-gray-500",
                    },
                    {
                      id: "card", icon: CreditCard,
                      title: "Cartão de Crédito",
                      subtitle: "Parcelamento em até 10x sem juros",
                      subtitleColor: "text-gray-500",
                    },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${
                          paymentMethod === method.id
                            ? "border-[#8C2F39] bg-rose-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon size={24} className={paymentMethod === method.id ? "text-[#8C2F39]" : "text-gray-400"} />
                        <div className="text-left flex-1">
                          <p className="font-medium">{method.title}</p>
                          <p className={`text-sm font-medium ${method.subtitleColor}`}>{method.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Credit card MP form */}
                {paymentMethod === "card" && (
                  <div id="mp-card-form" className="mt-6 space-y-4">
                    <input id="cardNumber" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]" />
                    <div className="grid grid-cols-2 gap-4">
                      <input id="expirationDate" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]" />
                      <input id="securityCode" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]" />
                    </div>
                    <input id="cardholderName" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]" />
                    <input id="identificationNumber" defaultValue={form.cpf} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]" />
                    <select id="identificationType" className="hidden" defaultValue="CPF" />
                    <input id="cardholderEmail" defaultValue={form.email} className="hidden" />
                    <select
                      id="installments"
                      name="installments"
                      value={form.installments}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={String(n)}>
                          {n}x de R$ {(total / n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border p-6 sticky top-4 space-y-4">
                <h2 className="text-xl font-medium">Resumo do Pedido</h2>

                <div className="space-y-2 max-h-56 overflow-y-auto border-t pt-3">
                  {cartItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm gap-2">
                      <span className="text-gray-700 truncate">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-medium shrink-0">
                        R$ {((item.price || item.pixPrice) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete</span>
                    <span>{shippingCost === 0 ? "—" : `R$ ${shippingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Desconto PIX (10%)</span>
                      <span>- R$ {discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-[#8C2F39]">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !selectedShipping}
                  className="w-full bg-[#8C2F39] text-white py-4 rounded-lg font-semibold hover:bg-[#7a2832] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Processando...</>
                  ) : (
                    <>
                      <Lock size={16} />
                      Finalizar Pedido
                    </>
                  )}
                </button>

                {!selectedShipping && shippingOptions.length === 0 && (
                  <p className="text-xs text-amber-600 text-center">
                    Digite o CEP para calcular o frete
                  </p>
                )}

                <div className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                  <Lock size={10} />
                  Pagamento 100% seguro via Mercado Pago
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
