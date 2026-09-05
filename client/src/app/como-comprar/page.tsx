import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Como Comprar",
  description:
    "Passo a passo para revendedoras comprarem no atacado da Feminnita — pedido mínimo R$ 199.",
};

export default function ComoComprarPage() {
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
            Como Comprar
          </h2>

          <div className="space-y-6 text-base leading-relaxed text-gray-700">
            <p>
              A Feminnita vende no atacado, para revendedoras e lojistas.
              Comprar é simples:
            </p>

            <ol className="list-decimal space-y-4 pl-5">
              <li>
                <strong>Monte o seu pedido.</strong> Navegue pelas categorias,
                escolha os modelos, tamanhos e cores e adicione ao carrinho até
                atingir o pedido mínimo de <strong>R$ 199</strong>.
              </li>
              <li>
                <strong>Revise o carrinho.</strong> Confira as peças, as
                quantidades e o valor total antes de seguir.
              </li>
              <li>
                <strong>Informe o CEP de entrega.</strong> No checkout, o frete é
                calculado por CEP e você vê o custo e o prazo estimado antes de
                confirmar.
              </li>
              <li>
                <strong>Escolha o pagamento.</strong> Você paga com{" "}
                <strong>Pix</strong>, <strong>boleto bancário</strong> ou{" "}
                <strong>cartão de crédito em até 3x sem juros</strong>.
              </li>
              <li>
                <strong>Finalize a compra.</strong> Após a confirmação do
                pagamento, o pedido é separado e enviado por Correios ou
                transportadora.
              </li>
            </ol>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Precisa de ajuda?
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
                . Atendimento de segunda a quinta, das 8h às 17h, e sexta, das 8h
                às 16h.
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
