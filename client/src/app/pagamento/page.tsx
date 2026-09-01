import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Formas de pagamento",
  description:
    "Pague com Pix (5% de desconto), cartão de crédito em até 3x sem juros ou boleto bancário. A Feminnita não armazena dados do cartão.",
  robots: { index: true, follow: true },
};

export default function PagamentoPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-light text-[#8C2F39]">
          Formas de pagamento
        </h1>

        <div className="space-y-5 text-gray-700 leading-relaxed">
          <p>
            <strong>Pix</strong> — com <strong>5% de desconto</strong> à vista.
            É a forma mais rápida: o pedido entra em separação assim que o
            pagamento é confirmado.
          </p>
          <p>
            <strong>Cartão de crédito</strong> — em até{" "}
            <strong>3x sem juros</strong>.
          </p>
          <p>
            <strong>Boleto bancário</strong> — o pedido é separado após a
            compensação, que costuma levar de 1 a 3 dias úteis.
          </p>
          <p>
            Você escolhe a forma de pagamento no fim do pedido, e as instruções
            chegam por e-mail logo em seguida.
          </p>
          <p>
            Todos os pagamentos são processados por gateway certificado.{" "}
            <strong>A Feminnita não armazena os dados do seu cartão.</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
