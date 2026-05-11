"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CheckCircle, Package, Truck, Mail, Download, Copy, Barcode, QrCode } from "lucide-react";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      const foundOrder = orders.find((o: any) => o.id === orderId);
      setOrder(foundOrder);

      if (foundOrder) {
        // Send confirmation email (simulation)
        sendConfirmationEmail(foundOrder);
      }
    }
  }, [orderId]);

  const sendConfirmationEmail = async (orderData: any) => {
    // Em produção, fazer requisição para API que envia email
    const emailData = {
      to: orderData.customer.email,
      subject: `Pedido #${orderData.id} Confirmado - Feminnita`,
      template: "order_confirmation",
      data: {
        orderId: orderData.id,
        customerName: orderData.customer.name,
        items: orderData.items,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        shipping: orderData.shipping,
      },
    };

    console.log("📧 Email de confirmação:", emailData);

    // Salvar para envio posterior
    const emailQueue = JSON.parse(localStorage.getItem("emailQueue") || "[]");
    emailQueue.push({
      ...emailData,
      sentAt: new Date().toISOString(),
      type: "order_confirmation",
    });
    localStorage.setItem("emailQueue", JSON.stringify(emailQueue));
  };

  const copyPixCode = () => {
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${order.id}520400005303986540${order.total.toFixed(2)}5802BR5925FEMINNITA6009SAO PAULO62070503***6304`;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-4xl font-light mb-2">Pedido Confirmado!</h1>
            <p className="text-gray-600 text-lg">
              Obrigado pela sua compra, {order.customer.name.split(" ")[0]}! 🎉
            </p>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg border p-8 mb-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Número do Pedido</p>
                <p className="text-2xl font-bold">#{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data</p>
                <p className="text-xl font-medium">
                  {new Date(order.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Forma de Pagamento</span>
                <span className="font-medium">
                  {order.paymentMethod === "pix" && "PIX"}
                  {order.paymentMethod === "boleto" && "Boleto Bancário"}
                  {order.paymentMethod === "card" && "Cartão de Crédito"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frete</span>
                <span className="font-medium">
                  {order.shipping?.name || "Calculado após pagamento"}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          </div>

          {/* PIX Payment */}
          {order.paymentMethod === "pix" && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <QrCode size={32} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    Pagamento via PIX
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Copie o código abaixo e cole no seu aplicativo bancário para realizar o pagamento:
                  </p>
                  <div className="bg-white p-4 rounded border border-blue-200 font-mono text-xs break-all mb-4">
                    00020126580014BR.GOV.BCB.PIX0136{order.id}520400005303986540{order.total.toFixed(2)}5802BR5925FEMINNITA6009SAO PAULO62070503***6304
                  </div>
                  <button
                    onClick={copyPixCode}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={20} />
                        Código Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={20} />
                        Copiar Código PIX
                      </>
                    )}
                  </button>
                  <p className="text-xs text-blue-700 mt-4">
                    ⏱️ O pagamento será confirmado em até 2 horas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Boleto Payment */}
          {order.paymentMethod === "boleto" && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Barcode size={32} className="text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    Boleto Bancário
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    O boleto foi enviado para o e-mail <strong>{order.customer.email}</strong>
                  </p>
                  <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2">
                    <Download size={20} />
                    Baixar Boleto
                  </button>
                  <p className="text-xs text-yellow-700 mt-4">
                    ⏱️ O pagamento será confirmado em até 2 dias úteis
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package size={20} />
              Itens do Pedido
            </h3>
            <div className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Cor: {item.selectedColor} | Qtd: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    R$ {(item.pixPrice * item.quantity).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Truck size={20} />
              Endereço de Entrega
            </h3>
            <div className="text-gray-700">
              <p>{order.customer.street}, {order.customer.number}</p>
              {order.customer.complement && <p>{order.customer.complement}</p>}
              <p>{order.customer.neighborhood}</p>
              <p>{order.customer.city} - {order.customer.state}</p>
              <p>CEP: {order.customer.cep}</p>
            </div>
          </div>

          {/* Email Confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="text-green-600 mt-1" size={20} />
              <div>
                <p className="font-medium text-green-900 mb-1">
                  E-mail de Confirmação Enviado
                </p>
                <p className="text-sm text-green-800">
                  Enviamos todos os detalhes do seu pedido para <strong>{order.customer.email}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Próximos Passos</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">1</span>
                <span className="text-gray-700">Realize o pagamento via {order.paymentMethod === "pix" ? "PIX" : order.paymentMethod === "boleto" ? "Boleto" : "Cartão de Crédito"}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">2</span>
                <span className="text-gray-700">Aguarde a confirmação do pagamento (você receberá um e-mail)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">3</span>
                <span className="text-gray-700">Após a aprovação, vamos separar e embalar seu pedido</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">4</span>
                <span className="text-gray-700">Você receberá o código de rastreamento por e-mail</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href="/" className="flex-1">
              <button className="w-full border-2 border-black text-black py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Voltar para Home
              </button>
            </Link>
            <Link href="/meus-pedidos" className="flex-1">
              <button className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                Ver Meus Pedidos
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <OrderConfirmedContent />
    </Suspense>
  );
}
