import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Como comprar",
  description:
    "Passo a passo para comprar no atacado na Feminnita: escolha as peças, atinja o mínimo de R$ 199, escolha frete e pagamento.",
  robots: { index: true, follow: true },
};

export default function ComoComprarPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">Como comprar</h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Comprar no atacado aqui é simples.
        </p>

        <ol className="space-y-4 text-gray-700 leading-relaxed">
          <li>
            <strong>1. Escolha as peças.</strong> Navegue pelas categorias e
            adicione ao carrinho o que quiser. Você pode misturar modelos, cores
            e tamanhos à vontade.
          </li>
          <li>
            <strong>2. Atinja o pedido mínimo de R$ 199.</strong> O valor pode
            ser somado com peças sortidas — não precisa levar várias unidades do
            mesmo item.
          </li>
          <li>
            <strong>3. Finalize o pedido.</strong> Clique em finalizar e entre
            com seu e-mail. Se ainda não tiver cadastro, é rápido de fazer.
          </li>
          <li>
            <strong>4. Escolha o frete.</strong> Trabalhamos com Correios e
            transportadora. O valor é calculado pelo peso do pedido e pelo CEP
            de destino, e aparece antes de você pagar.
          </li>
          <li>
            <strong>5. Escolha o pagamento.</strong> Pix com desconto, cartão de
            crédito em até 3x sem juros, ou boleto.
          </li>
          <li>
            <strong>6. Pronto.</strong> Você recebe a confirmação por e-mail e,
            assim que o pedido for postado, o código de rastreio.
          </li>
        </ol>

        <p className="mt-8 text-gray-700 leading-relaxed">
          Vende com CNPJ ou CPF? <strong>Aceitamos os dois.</strong>
        </p>
      </main>
    </div>
  );
}
