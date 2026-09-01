import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Envio e entrega",
  description:
    "Envio pela Feminnita com Correios e transportadora. Prazo e valor aparecem no carrinho antes de pagar, e o rastreio vai por e-mail.",
  robots: { index: true, follow: true },
};

export default function EnvioPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">
          Envio e entrega
        </h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Como o seu pedido chega.
        </p>

        <div className="space-y-5 text-gray-700 leading-relaxed">
          <p>
            Trabalhamos com <strong>Correios e transportadora</strong>. As
            opções disponíveis para o seu CEP, com prazo e valor de cada uma,
            aparecem no carrinho antes de você pagar — sem surpresa depois.
          </p>
          <p>
            O frete é calculado pelo{" "}
            <strong>peso total do pedido e pela região de destino</strong>.
          </p>
          <p>
            <strong>Prazo de postagem:</strong> despachamos no menor prazo
            possível após a confirmação do pagamento. Pix e cartão confirmam na
            hora; boleto leva de 1 a 3 dias úteis para compensar.
          </p>
          <p>
            <strong>Rastreio:</strong> assim que o pedido é postado, o código de
            rastreamento é enviado para o seu e-mail. Você também acompanha tudo
            em <strong>Minha conta → Meus pedidos</strong>.
          </p>
          <p>
            <strong>Quem pode receber:</strong> qualquer pessoa maior de idade
            no endereço informado, mediante documento e assinatura do protocolo.
          </p>
        </div>
      </main>
    </div>
  );
}
