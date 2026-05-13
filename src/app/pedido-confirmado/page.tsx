"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle, Copy, Barcode, QrCode, Truck, Package, ExternalLink } from "lucide-react";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId  = searchParams.get("id");
  const method   = searchParams.get("method") || "pix";
  const pixCode  = searchParams.get("pix")    ? decodeURIComponent(searchParams.get("pix")!)    : null;
  const pixImg   = searchParams.get("pixImg") ? decodeURIComponent(searchParams.get("pixImg")!) : null;
  const boletoUrl = searchParams.get("boleto") ? decodeURIComponent(searchParams.get("boleto")!) : null;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag && orderId)
      (window as any).gtag("event", "purchase_confirmed", { order_id: orderId });
  }, [orderId]);

  const copyPix = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[1400px] mx-auto px-6 py-32 text-center">
          <p className="text-[13px] text-gray-400">Pedido não encontrado.</p>
          <Link href="/" className="mt-6 inline-block text-[11px] uppercase tracking-widest border border-gray-800 px-8 py-3 hover:bg-gray-800 hover:text-white transition-colors">
            Voltar para a loja
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[680px] mx-auto px-6 py-16">

        {/* Confirmação */}
        <div className="text-center mb-12">
          <CheckCircle size={44} strokeWidth={1} className="mx-auto text-green-500 mb-5" />
          <h1 className="text-[22px] font-light text-gray-900 mb-2">Pedido Recebido!</h1>
          <p className="text-[12px] text-gray-500 uppercase tracking-widest">
            Número do pedido: <span className="text-gray-800 font-medium">#{orderId.slice(-8).toUpperCase()}</span>
          </p>
        </div>

        {/* PIX */}
        {method === "pix" && (
          <div className="border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <QrCode size={18} strokeWidth={1.5} className="text-gray-500" />
              <div>
                <p className="text-[13px] font-medium text-gray-800">Pague agora com PIX</p>
                <p className="text-[11px] text-gray-400">Confirmação imediata após o pagamento</p>
              </div>
            </div>

            {pixImg && (
              <div className="flex justify-center mb-5">
                <img src={`data:image/png;base64,${pixImg}`} alt="QR Code PIX" className="w-44 h-44 border border-gray-200" />
              </div>
            )}

            {pixCode && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Código PIX copia e cola</p>
                <div className="bg-gray-50 border border-gray-200 p-3 font-mono text-[11px] break-all mb-3 select-all text-gray-700">
                  {pixCode}
                </div>
                <button
                  onClick={copyPix}
                  className="w-full flex items-center justify-center gap-2 border border-gray-800 text-gray-800 text-[11px] uppercase tracking-widest py-3 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Copy size={13} />
                  {copied ? "Copiado!" : "Copiar código PIX"}
                </button>
              </>
            )}

            <p className="mt-4 text-[11px] text-gray-400 text-center">
              Código expira em <strong className="text-gray-600">24 horas</strong>
            </p>
          </div>
        )}

        {/* Boleto */}
        {method === "boleto" && (
          <div className="border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <Barcode size={18} strokeWidth={1.5} className="text-gray-500" />
              <div>
                <p className="text-[13px] font-medium text-gray-800">Boleto Bancário gerado</p>
                <p className="text-[11px] text-gray-400">Aprovação em até 2 dias úteis após o pagamento</p>
              </div>
            </div>
            {boletoUrl ? (
              <a
                href={boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-gray-800 text-gray-800 text-[11px] uppercase tracking-widest py-3 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <ExternalLink size={13} /> Abrir / Imprimir Boleto
              </a>
            ) : (
              <p className="text-[12px] text-gray-500">O boleto foi enviado para o seu e-mail.</p>
            )}
            <p className="mt-4 text-[11px] text-gray-400 text-center">Boleto vence em <strong className="text-gray-600">3 dias úteis</strong></p>
          </div>
        )}

        {/* Cartão aprovado */}
        {method === "card" && (
          <div className="border border-green-200 bg-green-50 p-5 mb-6 flex items-center gap-3">
            <CheckCircle size={18} strokeWidth={1.5} className="text-green-600 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-green-800">Pagamento aprovado!</p>
              <p className="text-[11px] text-green-700">Seu pedido será processado e enviado em breve.</p>
            </div>
          </div>
        )}

        {/* Próximas etapas */}
        <div className="border border-gray-100 p-6 mb-8">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-5">Próximas Etapas</p>
          <ol className="space-y-4">
            {[
              { n: 1, Icon: CheckCircle, text: method === "card" ? "Pagamento confirmado" : "Realize o pagamento" },
              { n: 2, Icon: Package,     text: "Separamos e embalamos seu pedido com cuidado" },
              { n: 3, Icon: Truck,       text: "Enviamos com código de rastreamento por e-mail" },
            ].map(({ n, Icon, text }) => (
              <li key={n} className="flex items-center gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-[#8C2F39] text-white flex items-center justify-center text-[11px] font-semibold">
                  {n}
                </span>
                <span className="text-[12px] text-gray-600">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <Link href="/" className="flex-1 text-center border border-gray-300 text-gray-700 text-[11px] uppercase tracking-widest py-3 hover:border-gray-600 transition-colors">
            Continuar comprando
          </Link>
          <Link href="/minha-conta" className="flex-1 text-center bg-gray-900 text-white text-[11px] uppercase tracking-widest py-3 hover:bg-[#8C2F39] transition-colors">
            Ver meus pedidos
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderConfirmedContent />
    </Suspense>
  );
}
