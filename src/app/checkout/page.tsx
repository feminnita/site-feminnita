"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreditCard, Barcode, QrCode, Truck, Lock, Loader2 } from "lucide-react";

declare global { interface Window { MercadoPago: any; } }

const inp = "w-full border border-gray-200 px-4 py-3 text-[13px] focus:outline-none focus:border-gray-500 bg-white";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [payMethod, setPayMethod] = useState("pix");
  const [processing, setProcessing] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shipping, setShipping] = useState<any>(null);
  const [calcShipping, setCalcShipping] = useState(false);
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
    localStorage.setItem("abandonedCart", JSON.stringify({ cart, timestamp: new Date().toISOString(), email: "" }));

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => setMpLoaded(true);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [router]);

  useEffect(() => {
    if (!mpLoaded || payMethod !== "card") return;
    const key = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!key) return;
    const mp = new window.MercadoPago(key, { locale: "pt-BR" });
    cardFormRef.current = mp.cardForm({
      amount: String(total),
      autoMount: true,
      form: {
        id: "mp-card-form",
        cardholderName: { id: "cardholderName" }, cardholderEmail: { id: "cardholderEmail" },
        cardNumber: { id: "cardNumber" }, expirationDate: { id: "expirationDate" },
        securityCode: { id: "securityCode" }, installments: { id: "installments-mp" },
        identificationType: { id: "identificationType" }, identificationNumber: { id: "identificationNumber" },
      },
      callbacks: { onFormMounted: (err: any) => { if (err) console.error(err); } },
    });
    return () => { cardFormRef.current?.unmount?.(); };
  }, [mpLoaded, payMethod]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (name === "email" && value.includes("@")) {
      const ab = JSON.parse(localStorage.getItem("abandonedCart") || "{}");
      localStorage.setItem("abandonedCart", JSON.stringify({ ...ab, email: value }));
    }
  };

  const onCepBlur = async () => {
    const c = form.cep.replace(/\D/g, "");
    if (c.length !== 8) return;
    try {
      const d = await fetch(`https://viacep.com.br/ws/${c}/json/`).then(r => r.json());
      if (!d.erro) {
        setForm(p => ({ ...p, street: d.logradouro || p.street, neighborhood: d.bairro || p.neighborhood, city: d.localidade, state: d.uf }));
        setCalcShipping(true);
        const res = await fetch("/api/shipping/calculate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cep: c, products: cartItems }),
        });
        const data = await res.json();
        setShippingOptions(data.options || []);
        if (data.options?.[0]) setShipping(data.options[0]);
      }
    } catch {} finally { setCalcShipping(false); }
  };

  const subtotal = cartItems.reduce((s, i) => s + (i.pixPrice || i.price) * i.quantity, 0);
  const shippingCost = shipping?.price || 0;
  const discount = payMethod === "pix" ? subtotal * 0.1 : 0;
  const total = subtotal + shippingCost - discount;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping && shippingOptions.length > 0) { setError("Selecione uma opção de frete."); return; }
    setError(""); setProcessing(true);
    try {
      let cardToken = null;
      if (payMethod === "card" && cardFormRef.current) {
        cardToken = cardFormRef.current.getCardFormData()?.token;
        if (!cardToken) throw new Error("Erro ao tokenizar cartão. Verifique os dados.");
      }
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: { ...form, cpf: form.cpf.replace(/\D/g, "") }, items: cartItems, paymentMethod: payMethod, selectedShipping: shipping, subtotal, shippingCost, discount, total, cardToken, installments: form.installments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar pedido");
      if (typeof window !== "undefined") {
        (window as any).gtag?.("event", "purchase", { transaction_id: data.orderNumber, value: total, currency: "BRL" });
        (window as any).fbq?.("track", "Purchase", { value: total, currency: "BRL" });
      }
      localStorage.removeItem("cart"); localStorage.removeItem("abandonedCart");
      window.dispatchEvent(new Event("cartUpdated"));
      const params = new URLSearchParams({ id: data.orderId, method: payMethod });
      if (data.pixQrCode) params.set("pix", encodeURIComponent(data.pixQrCode));
      if (data.boletoUrl) params.set("boleto", encodeURIComponent(data.boletoUrl));
      router.push(`/pedido-confirmado?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || "Erro ao processar pedido. Tente novamente.");
      setProcessing(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Topo seguro */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2">
          <Lock size={13} className="text-green-600" />
          <span className="text-[11px] uppercase tracking-widest text-gray-500">Finalizar Compra</span>
          <span className="text-[10px] text-green-600 ml-1">— Ambiente Seguro</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 pt-5 pb-2">
        <nav className="flex gap-1 text-[11px] text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link href="/carrinho" className="hover:text-gray-700">Carrinho</Link>
          <span>/</span>
          <span className="text-gray-700">Checkout</span>
        </nav>
      </div>

      {error && (
        <div className="max-w-[1400px] mx-auto px-6 mt-4">
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-w-[1400px] mx-auto px-6 py-8 grid lg:grid-cols-3 gap-10">

          {/* ── Coluna esquerda: formulário ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Dados pessoais */}
            <div>
              <h2 className="text-[11px] uppercase tracking-widest text-gray-700 mb-5 pb-3 border-b border-gray-100">
                Dados Pessoais
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                <input name="name"  placeholder="Nome Completo *" required value={form.name}  onChange={set} className={inp} />
                <input name="email" type="email" placeholder="E-mail *" required value={form.email} onChange={set} className={inp} />
                <input name="cpf"   placeholder="CPF *"   required value={form.cpf}   onChange={set} className={inp} />
                <input name="phone" placeholder="Telefone / WhatsApp *" required value={form.phone} onChange={set} className={inp} />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h2 className="text-[11px] uppercase tracking-widest text-gray-700 mb-5 pb-3 border-b border-gray-100">
                Endereço de Entrega
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                <input name="cep" placeholder="CEP *" required value={form.cep} onChange={set} onBlur={onCepBlur} className={`${inp} md:col-span-2`} />
                <input name="street" placeholder="Rua *" required value={form.street} onChange={set} className={`${inp} md:col-span-2`} />
                <input name="number" placeholder="Número *" required value={form.number} onChange={set} className={inp} />
                <input name="complement" placeholder="Complemento" value={form.complement} onChange={set} className={inp} />
                <input name="neighborhood" placeholder="Bairro *" required value={form.neighborhood} onChange={set} className={inp} />
                <input name="city" placeholder="Cidade *" required value={form.city} onChange={set} className={inp} />
                <input name="state" placeholder="UF *" required value={form.state} onChange={set} maxLength={2} className={inp} />
              </div>

              {/* Opções de frete */}
              {calcShipping && (
                <div className="mt-5 flex items-center gap-2 text-[12px] text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> Calculando frete…
                </div>
              )}
              {shippingOptions.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                    <Truck size={13} /> Opções de Frete
                  </p>
                  <div className="space-y-2">
                    {shippingOptions.map(opt => (
                      <button
                        key={opt.id} type="button" onClick={() => setShipping(opt)}
                        className={`w-full px-4 py-3 border text-left transition-colors ${shipping?.id === opt.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[12px] text-gray-800">{opt.name}</p>
                            <p className="text-[11px] text-gray-400">{opt.company} — {opt.delivery_time}</p>
                          </div>
                          <p className="text-[13px] font-medium text-gray-900">R$ {fmt(opt.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pagamento */}
            <div>
              <h2 className="text-[11px] uppercase tracking-widest text-gray-700 mb-5 pb-3 border-b border-gray-100">
                Forma de Pagamento
              </h2>
              <div className="space-y-2">
                {[
                  { id: "pix",    Icon: QrCode,      label: "PIX",               sub: "10% de desconto — aprovação imediata", subCls: "text-green-600" },
                  { id: "boleto", Icon: Barcode,      label: "Boleto Bancário",   sub: "Aprovação em até 2 dias úteis",        subCls: "text-gray-400" },
                  { id: "card",   Icon: CreditCard,   label: "Cartão de Crédito", sub: "Parcelamento em até 10× sem juros",    subCls: "text-gray-400" },
                ].map(({ id, Icon, label, sub, subCls }) => (
                  <button
                    key={id} type="button" onClick={() => setPayMethod(id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 border transition-colors ${payMethod === id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}
                  >
                    <Icon size={18} strokeWidth={1.5} className={payMethod === id ? "text-gray-900" : "text-gray-400"} />
                    <div className="text-left">
                      <p className="text-[13px] text-gray-800">{label}</p>
                      <p className={`text-[11px] ${subCls}`}>{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Campos cartão MP */}
              {payMethod === "card" && (
                <div id="mp-card-form" className="mt-5 space-y-3">
                  <input id="cardNumber"           placeholder="Número do Cartão" className={inp} />
                  <div className="grid grid-cols-2 gap-3">
                    <input id="expirationDate"     placeholder="MM/AA" className={inp} />
                    <input id="securityCode"       placeholder="CVV"   className={inp} />
                  </div>
                  <input id="cardholderName"       placeholder="Nome no Cartão" className={inp} />
                  <input id="identificationNumber" placeholder="CPF"   defaultValue={form.cpf} className={inp} />
                  <select id="identificationType"  defaultValue="CPF"  className="hidden" />
                  <input id="cardholderEmail"      defaultValue={form.email} className="hidden" />
                  <select
                    id="installments-mp" name="installments" value={form.installments} onChange={set}
                    className={inp}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n}× de R$ {fmt(total / n)} sem juros</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ── Coluna direita: resumo ── */}
          <div className="lg:col-span-1">
            <div className="border border-gray-100 p-6 sticky top-28">
              <h2 className="text-[11px] uppercase tracking-widest text-gray-700 mb-6">Resumo do Pedido</h2>

              <div className="space-y-3 pb-5 border-b border-gray-100 max-h-52 overflow-y-auto">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="text-[12px] text-gray-600 truncate">{item.quantity}× {item.name}</span>
                    <span className="text-[12px] text-gray-800 shrink-0">R$ {fmt((item.pixPrice || item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 py-4 border-b border-gray-100">
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Subtotal</span><span>R$ {fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Frete</span>
                  <span>{shippingCost === 0 ? "—" : `R$ ${fmt(shippingCost)}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[12px] text-green-600">
                    <span>Desconto PIX (10%)</span><span>- R$ {fmt(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-[12px] font-medium text-gray-800">Total</span>
                <span className="text-[18px] font-medium text-gray-900">R$ {fmt(total)}</span>
              </div>

              {!shipping && shippingOptions.length === 0 && (
                <p className="text-[10px] text-amber-600 py-2 text-center">Digite o CEP para calcular o frete</p>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full mt-5 bg-gray-900 text-white text-[11px] uppercase tracking-widest py-4 hover:bg-[#8C2F39] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {processing
                  ? <><Loader2 size={14} className="animate-spin" /> Processando…</>
                  : <><Lock size={12} /> Finalizar Pedido</>
                }
              </button>

              <p className="text-[10px] text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
                <Lock size={9} /> Pagamento 100% seguro via Mercado Pago
              </p>
            </div>
          </div>

        </div>
      </form>

      <Footer />
    </div>
  );
}
