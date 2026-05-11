"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { CreditCard, Barcode, QrCode, Truck, Lock } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Info
    name: "",
    email: "",
    cpf: "",
    phone: "",
    // Address
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    // Payment
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    installments: "1",
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) {
      router.push("/carrinho");
    }
    setCartItems(cart);

    // Google Analytics - Begin Checkout
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'begin_checkout', {
        currency: 'BRL',
        value: calculateSubtotal(cart),
        items: cart.map((item: any) => ({
          item_id: item.id,
          item_name: item.name,
          price: item.pixPrice,
          quantity: item.quantity
        }))
      });
    }

    // Facebook Pixel - Initiate Checkout
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_ids: cart.map((item: any) => item.id),
        contents: cart.map((item: any) => ({
          id: item.id,
          quantity: item.quantity
        })),
        value: calculateSubtotal(cart),
        currency: 'BRL'
      });
    }

    // Save cart data for abandoned cart recovery
    saveAbandonedCart(cart);
  }, [router]);

  const calculateSubtotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.pixPrice * item.quantity, 0);
  };

  const saveAbandonedCart = (cart: any[]) => {
    const abandonedCartData = {
      cart,
      timestamp: new Date().toISOString(),
      email: formData.email || "",
      url: window.location.href,
    };
    localStorage.setItem("abandonedCart", JSON.stringify(abandonedCartData));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Save email for abandoned cart
    if (name === "email" && value.includes("@")) {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      saveAbandonedCart(cart);

      localStorage.setItem("checkoutEmail", value);
    }
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "");

    if (cep.length === 8) {
      try {
        // Buscar endereço pelo CEP
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData({
            ...formData,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          });

          // Calcular frete com Melhor Envio (simulação)
          await calculateShipping(cep);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const calculateShipping = async (cep: string) => {
    setIsCalculatingShipping(true);

    try {
      // Simulação de opções de frete
      // Em produção, integrar com API do Melhor Envio
      const mockShippingOptions = [
        {
          id: "pac",
          name: "PAC",
          price: 15.50,
          delivery_time: "8-12 dias úteis",
          company: "Correios",
        },
        {
          id: "sedex",
          name: "SEDEX",
          price: 25.90,
          delivery_time: "3-5 dias úteis",
          company: "Correios",
        },
        {
          id: "jadlog",
          name: "Jadlog Econômico",
          price: 12.90,
          delivery_time: "10-15 dias úteis",
          company: "Jadlog",
        },
      ];

      setTimeout(() => {
        setShippingOptions(mockShippingOptions);
        setSelectedShipping(mockShippingOptions[0]);
        setIsCalculatingShipping(false);
      }, 1000);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      setIsCalculatingShipping(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.pixPrice * item.quantity,
    0
  );

  const shipping = selectedShipping ? selectedShipping.price : 0;
  const discount = paymentMethod === "pix" ? subtotal * 0.1 : 0;
  const total = subtotal + shipping - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Google Analytics - Add Payment Info
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'add_payment_info', {
        currency: 'BRL',
        value: total,
        payment_type: paymentMethod
      });
    }

    // Facebook Pixel - Add Payment Info
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq('track', 'AddPaymentInfo', {
        value: total,
        currency: 'BRL',
        content_ids: cartItems.map(item => item.id)
      });
    }

    setTimeout(() => {
      const order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toISOString(),
        items: cartItems,
        customer: formData,
        paymentMethod,
        shippingOption: selectedShipping,
        subtotal,
        shipping,
        discount,
        total,
        status: "pending",
      };

      // Save order
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push(order);
      localStorage.setItem("orders", JSON.stringify(orders));

      // Google Analytics - Purchase
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: order.id,
          value: total,
          currency: 'BRL',
          shipping: shipping,
          items: cartItems.map(item => ({
            item_id: item.id,
            item_name: item.name,
            price: item.pixPrice,
            quantity: item.quantity
          }))
        });
      }

      // Facebook Pixel - Purchase
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: total,
          currency: 'BRL',
          contents: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          })),
          content_type: 'product'
        });
      }

      // Clear cart and abandoned cart
      localStorage.removeItem("cart");
      localStorage.removeItem("abandonedCart");
      window.dispatchEvent(new Event("cartUpdated"));

      // Redirect to confirmation
      router.push(`/pedido-confirmado?id=${order.id}`);
    }, 2000);
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Lock size={20} className="text-green-600" />
          <h1 className="text-3xl font-light">Finalizar Compra</h1>
          <span className="text-sm text-green-600 font-medium ml-2">
            Ambiente Seguro
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-xl font-medium mb-4">Dados Pessoais</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    name="name"
                    placeholder="Nome Completo *"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="E-mail *"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                  <input
                    name="cpf"
                    placeholder="CPF *"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                  <input
                    name="phone"
                    placeholder="Telefone/WhatsApp *"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-xl font-medium mb-4">Endereço de Entrega</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      name="cep"
                      placeholder="CEP *"
                      value={formData.cep}
                      onChange={handleInputChange}
                      onBlur={handleCepBlur}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <input
                    name="street"
                    placeholder="Rua *"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                  <input
                    name="number"
                    placeholder="Número *"
                    value={formData.number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                  <input
                    name="complement"
                    placeholder="Complemento"
                    value={formData.complement}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <input
                    name="neighborhood"
                    placeholder="Bairro *"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                  <input
                    name="city"
                    placeholder="Cidade *"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                  <input
                    name="state"
                    placeholder="Estado (UF) *"
                    value={formData.state}
                    onChange={handleInputChange}
                    maxLength={2}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>

                {/* Shipping Options */}
                {shippingOptions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Truck size={20} />
                      Escolha o Frete
                    </h3>
                    <div className="space-y-3">
                      {shippingOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedShipping(option)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            selectedShipping?.id === option.id
                              ? "border-black bg-gray-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{option.name}</p>
                              <p className="text-sm text-gray-600">
                                {option.company} - {option.delivery_time}
                              </p>
                            </div>
                            <p className="font-semibold">
                              R$ {option.price.toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isCalculatingShipping && (
                  <div className="mt-4 text-center text-gray-600">
                    Calculando opções de frete...
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg p-6 border">
                <h2 className="text-xl font-medium mb-4">Forma de Pagamento</h2>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg ${
                      paymentMethod === "pix"
                        ? "border-black bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <QrCode size={24} />
                    <div className="text-left flex-1">
                      <p className="font-medium">PIX</p>
                      <p className="text-sm text-green-600 font-semibold">
                        10% DE DESCONTO - Aprovação imediata
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("boleto")}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg ${
                      paymentMethod === "boleto"
                        ? "border-black bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <Barcode size={24} />
                    <div className="text-left flex-1">
                      <p className="font-medium">Boleto Bancário</p>
                      <p className="text-sm text-gray-600">
                        Aprovação em até 2 dias úteis
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg ${
                      paymentMethod === "card"
                        ? "border-black bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <CreditCard size={24} />
                    <div className="text-left flex-1">
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-gray-600">
                        Parcelamento em até 10x sem juros
                      </p>
                    </div>
                  </button>
                </div>

                {/* Credit Card Form */}
                {paymentMethod === "card" && (
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <input
                      name="cardNumber"
                      placeholder="Número do Cartão *"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="md:col-span-2 w-full px-4 py-3 border rounded-lg"
                      required
                    />
                    <input
                      name="cardName"
                      placeholder="Nome no Cartão *"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="md:col-span-2 w-full px-4 py-3 border rounded-lg"
                      required
                    />
                    <input
                      name="cardExpiry"
                      placeholder="Validade (MM/AA) *"
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg"
                      required
                    />
                    <input
                      name="cardCvv"
                      placeholder="CVV *"
                      value={formData.cardCvv}
                      onChange={handleInputChange}
                      maxLength={4}
                      className="w-full px-4 py-3 border rounded-lg"
                      required
                    />
                    <select
                      name="installments"
                      value={formData.installments}
                      onChange={handleInputChange}
                      className="md:col-span-2 w-full px-4 py-3 border rounded-lg"
                    >
                      <option value="1">1x sem juros</option>
                      <option value="2">2x sem juros</option>
                      <option value="3">3x sem juros</option>
                      <option value="4">4x sem juros</option>
                      <option value="5">5x sem juros</option>
                      <option value="6">6x sem juros</option>
                      <option value="7">7x sem juros</option>
                      <option value="8">8x sem juros</option>
                      <option value="9">9x sem juros</option>
                      <option value="10">10x sem juros</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border p-6 space-y-4 sticky top-4">
                <h2 className="text-xl font-medium">Resumo do Pedido</h2>

                {/* Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto border-t pt-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <span className="flex-1">
                        {item.quantity}x {item.name} ({item.selectedColor})
                      </span>
                      <span className="font-medium">
                        R$ {(item.pixPrice * item.quantity).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2 text-sm">
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
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto PIX (10%)</span>
                      <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                >
                  {isProcessing ? "Processando..." : "Finalizar Pedido"}
                </button>

                <div className="text-xs text-center text-gray-500">
                  <Lock size={12} className="inline mr-1" />
                  Seus dados estão protegidos
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
