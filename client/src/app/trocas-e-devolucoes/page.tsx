import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description:
    "Política de troca e devolução da Feminnita: 7 dias para arrependimento e 30 dias para defeito de fabricação, com as condições aplicáveis.",
  robots: { index: true, follow: true },
};

export default function TrocasEDevolucoesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">
          Trocas e devoluções
        </h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Política de troca e devolução
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Prazos</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Arrependimento ou troca:</strong> até{" "}
                <strong>7 dias corridos</strong> contados do recebimento.
              </li>
              <li>
                <strong>Defeito de fabricação:</strong> até{" "}
                <strong>30 dias corridos</strong> contados do recebimento.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Condições
            </h2>
            <p>
              O produto precisa estar{" "}
              <strong>
                sem uso, sem sinais de lavagem, com etiquetas e tags originais,
                na embalagem adequada e acompanhado da nota fiscal
              </strong>
              .
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Como solicitar
            </h2>
            <p>
              Fale com a gente <strong>antes de enviar qualquer coisa</strong>,
              pelo WhatsApp (22) 99281-0707 ou pelo e-mail
              fntlingerie@gmail.com, informando o número do pedido e o motivo.
              Depois da aprovação, orientamos o envio.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Direito de arrependimento e devolução
            </h2>
            <p className="mb-3">
              A loja atua predominantemente com{" "}
              <strong>vendas no atacado, destinadas à revenda</strong>.
            </p>
            <p className="mb-3">
              <strong>
                Nas compras realizadas por consumidor final, para uso próprio
              </strong>
              , fica garantido o direito de arrependimento no prazo de{" "}
              <strong>7 dias corridos</strong> contados do recebimento do
              pedido. Nesse caso, serão restituídos integralmente os valores
              pagos, <strong>incluindo o frete</strong>, e a devolução ocorrerá{" "}
              <strong>sem custos para o consumidor</strong>. O produto deverá
              ser devolvido sem sinais de uso, lavagem ou alteração, com
              etiquetas e embalagem original. O direito decorre do artigo 49 do
              Código de Defesa do Consumidor.
            </p>
            <p className="mb-3">
              <strong>Nas compras realizadas para fins de revenda</strong>,
              caracterizadas como operações comerciais de atacado, o direito de
              arrependimento previsto no artigo 49 do CDC não se aplica
              automaticamente. Eventuais devoluções por desistência ou
              conveniência da revendedora dependerão de autorização prévia da
              FNT Confecções Ltda e, quando aceitas, o frete de retorno será de
              responsabilidade da compradora.
            </p>
            <p>
              <strong>
                Nos casos de produto com defeito de fabricação, item enviado
                incorretamente ou divergência causada pela FNT Confecções Ltda
              </strong>
              , os custos necessários para troca ou devolução serão assumidos
              pela empresa.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Depois da devolução
            </h2>
            <p>
              Recebida e conferida a peça, você escolhe entre{" "}
              <strong>crédito para uma nova compra</strong> ou{" "}
              <strong>devolução do valor pago</strong>.
            </p>
          </div>

          <p>
            Pedidos que não atenderem às condições acima podem ser recusados e
            devolvidos ao remetente.
          </p>
        </div>
      </main>
    </div>
  );
}
