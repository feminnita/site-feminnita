import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PedidoConfirmadoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#fff8f8", border: "2px solid #8C2F39" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8C2F39" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          className="text-3xl font-extralight tracking-wider mb-3"
          style={{ fontFamily: "serif", color: "#2e1a20" }}
        >
          Pedido Confirmado!
        </h1>
        <p className="text-[14px] text-gray-500 mb-2">
          Obrigada pela sua compra, {"{nome}"}!
        </p>
        <p className="text-[13px] text-gray-400 mb-8">
          Você receberá um e-mail com os detalhes do pedido e o código de rastreio assim que o produto for despachado.
        </p>

        <div className="border border-gray-100 p-6 mb-8 text-left">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-3">Resumo do Pedido</p>
          <div className="flex justify-between text-[13px] text-gray-600 mb-2">
            <span>Número do pedido</span>
            <span className="font-semibold">#000000</span>
          </div>
          <div className="flex justify-between text-[13px] text-gray-600">
            <span>Previsão de entrega</span>
            <span className="font-semibold">5 a 10 dias úteis</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/minha-conta/pedidos"
            className="border text-[11px] uppercase tracking-[0.2em] px-8 py-3 hover:bg-gray-800 hover:text-white transition-colors"
            style={{ borderColor: "#333", color: "#333" }}
          >
            Ver Meus Pedidos
          </Link>
          <Link
            href="/"
            className="text-white text-[11px] uppercase tracking-[0.2em] px-8 py-3 hover:opacity-90 transition-opacity"
            style={{ background: "#8C2F39" }}
          >
            Continuar Comprando
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
