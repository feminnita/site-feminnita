import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Envio e Entrega",
  description:
    "Como funciona o envio e a entrega dos pedidos Feminnita — frete por CEP, Correios e transportadora.",
};

export default function EnvioEEntregaPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F2] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold tracking-widest text-[#1A1A1A]">
              FEMINNITA
            </h1>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="mb-6 border-b border-gray-100 pb-4 text-2xl font-light text-[#1A1A1A]">
            Envio e Entrega
          </h2>

          <div className="space-y-6 text-base leading-relaxed text-gray-700">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Pedido mínimo
              </h3>
              <p>
                Por ser uma loja de atacado para revenda, o pedido mínimo é de{" "}
                <strong>R$ 199</strong>. Monte o seu carrinho até atingir esse
                valor para finalizar a compra.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Formas de envio
              </h3>
              <p>
                Enviamos para todo o Brasil por <strong>Correios</strong> e por{" "}
                <strong>transportadora</strong>. A opção disponível depende do
                CEP de entrega.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Frete
              </h3>
              <p>
                O valor do frete é <strong>calculado por CEP</strong>. Ao informar
                o seu CEP no checkout, o sistema mostra as opções de envio, o
                custo e o <strong>prazo estimado de entrega</strong> antes de você
                confirmar o pedido.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Ao receber
              </h3>
              <p>
                Confira a mercadoria assim que receber. Havendo divergência de
                quantidade, tamanho ou cor, avise em até 3 dias úteis com foto da
                embalagem e das peças. Veja mais em{" "}
                <Link
                  href="/trocas-e-devolucoes"
                  className="text-[#8C2F39] hover:underline"
                >
                  Trocas e Devoluções
                </Link>
                .
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Dúvidas sobre o seu envio
              </h3>
              <p>
                Fale com o atendimento pelo WhatsApp{" "}
                <a
                  href="https://wa.me/5522992810707"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8C2F39] hover:underline"
                >
                  (22) 99281-0707
                </a>{" "}
                ou pelo e-mail{" "}
                <a
                  href="mailto:feminnita@gmail.com"
                  className="text-[#8C2F39] hover:underline"
                >
                  feminnita@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Voltar para a loja
          </Link>
        </p>
      </div>
    </div>
  );
}
