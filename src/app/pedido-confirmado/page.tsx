"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CheckCircle, Copy, Barcode, QrCode, Truck, Package, ExternalLink } from "lucide-react";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const method = searchParams.get("method") || "pix";
  const pixCode = searchParams.get("pix") ? decodeURIComponent(searchParams.get("pix")!) : null;
  const pixImg = searchParams.get("pixImg") ? decodeURIComponent(searchParams.get("pixImg")!) : null;
  const boletoUrl = searchParams.get("boleto") ? decodeURIComponent(searchParams.get("boleto")!) : null;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag && orderId) {
      (window as any).gtag("event", "purchase_confirmed", { order_id: orderId });
    }
  }, [orderId]);

  const copyPix = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!orderId) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-gray-500">Pedido não encontrado.</p>
          <Link href="/" className="mt-4 inline-block text-[#8C2F39] underline">Voltar para a loja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle size={44} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-light mb-2">Pedido Recebido!</h1>
            <p className="text-gray-500">Número do pedido: <strong className="text-gray-800">#{orderId.slice(-8).toUpperCase()}</strong></p>
          </div>

          {/* PIX payment */}
          {method === "pix" && (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <QrCode size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Pague agora com PIX</h3>
                  <p className="text-sm text-gray-500">O pedido será confirmado em instantes após o pagamento</p>
                </div>
              </div>

              {pixImg && (
                <div className="flex justify-center mb-4">
                  <img
                    src={`data:image/png;base64,${pixImg}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
              )}

              {pixCode && (
                <>
                  <p className="text-xs text-gray-500 mb-2">Ou copie o código PIX:</p>
                  <div className="bg-gray-50 border rounded-lg p-3 font-mono text-xs break-all mb-3 select-all">
                    {pixCode}
                  </div>
                  <button
                    onClick={copyPix}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Copy size={16} />
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                </>
              )}

              <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                ⏱️ O código PIX expira em <strong>24 horas</strong>. Após o pagamento você receberá um e-mail de confirmação.
              </div>
            </div>
          )}

          {/* Boleto */}
          {method === "boleto" && (
            <div className="bg-white rounded-xl border-2 border-yellow-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Barcode size={24} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Boleto Bancário gerado</h3>
                  <p className="text-sm text-gray-500">Pague até o vencimento para confirmar o pedido</p>
                </div>
              </div>

              {boletoUrl ? (
                <a
                  href={boletoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-white py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  <ExternalLink size={16} />
                  Abrir / Imprimir Boleto
                </a>
              ) : (
                <p className="text-sm text-gray-500">O boleto foi enviado para o seu e-mail.</p>
              )}

              <p className="mt-4 text-xs text-yellow-700 bg-yellow-50 rounded-lg p-3">
                ⏱️ Aprovação em até <strong>2 dias úteis</strong> após o pagamento. O boleto vence em 3 dias.
              </p>
            </div>
          )}

          {/* Card approved */}
          {method === "card" && (
            <div className="bg-white rounded-xl border-2 border-green-200 p-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Pagamento aprovado!</h3>
                  <p className="text-sm text-gray-500">Seu pedido será processado e enviado em breve</p>
                </div>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="font-semibold mb-4">Próximas etapas</h3>
            <ol className="space-y-3">
              {[
                { n: 1, icon: CheckCircle, text: method === "card" ? "Pagamento confirmado" : "Realize o pagamento" },
                { n: 2, icon: Package, text: "Separamos e embalamos seu pedido" },
                { n: 3, icon: Truck, text: "Enviamos com código de rastreamento por e-mail" },
              ].map(({ n, icon: Icon, text }) => (
                <li key={n} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-[#8C2F39] text-white rounded-full flex items-center justify-center text-sm font-bold">{n}</span>
                  <span className="text-gray-700 text-sm">{text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <button className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Continuar comprando
              </button>
            </Link>
            <Link href="/minha-conta" className="flex-1">
              <button className="w-full bg-[#8C2F39] text-white py-3 rounded-lg font-medium hover:bg-[#7a2832] transition-colors">
                Ver meus pedidos
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderConfirmedContent />
    </Suspense>
  );
}
