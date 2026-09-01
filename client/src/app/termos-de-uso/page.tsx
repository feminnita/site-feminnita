import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso da loja Feminnita, operada por FNT Confecções Ltda: venda no atacado, produtos, preços, conta, foro e mais.",
  robots: { index: true, follow: true },
};

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">
          Termos de Uso
        </h1>
        <p className="mb-8 text-sm italic text-gray-500">
          Última atualização: 01/09/2026
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Ao usar este site, você concorda com as condições abaixo. A loja é
            operada por <strong>FNT Confecções Ltda</strong>, CNPJ
            62.893.101/0001-96.
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">A loja</h2>
            <p>
              Este é um site de <strong>venda no atacado</strong>, com pedido
              mínimo de R$ 199. Aceitamos compras com CPF ou CNPJ.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Produtos, cores e disponibilidade
            </h2>
            <p className="mb-3">
              Descrevemos e fotografamos as peças com o máximo de cuidado. Ainda
              assim, <strong>cores e estampas podem variar</strong> conforme o
              monitor e a tela de cada pessoa, e conforme o lote de tecido.
              Pequenas variações não caracterizam defeito.
            </p>
            <p>
              A disponibilidade depende do estoque no momento da compra. Se um
              item ficar indisponível depois do pedido, entramos em contato para
              substituir ou devolver o valor.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Preços</h2>
            <p>
              Os preços são os do site no momento da compra, e podem mudar sem
              aviso. Erros evidentes de preço podem ser corrigidos, com aviso ao
              cliente e possibilidade de cancelar o pedido sem custo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Sua conta
            </h2>
            <p>
              Você é responsável pelos dados que cadastra e por manter a senha em
              segurança. Avise a gente se suspeitar de uso indevido.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Uso do site
            </h2>
            <p>
              O conteúdo — textos, fotos, marca e layout — é nosso ou
              licenciado, e não pode ser copiado para uso comercial sem
              autorização.{" "}
              <strong>
                As fotos dos produtos podem ser usadas livremente pelas nossas
                revendedoras para divulgar as peças que compraram.
              </strong>
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Limitações
            </h2>
            <p>
              Trabalhamos para manter o site no ar e correto, mas não garantimos
              funcionamento ininterrupto nem ausência total de erros de
              conteúdo. Não respondemos por falhas de conexão, equipamento ou
              serviços de terceiros fora do nosso controle.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Declaração de destinação da compra
            </h2>
            <p>
              No fechamento do pedido, a compradora declara a destinação da
              mercadoria. Essa declaração define quais condições de troca e
              devolução se aplicam ao pedido, conforme a política de Trocas e
              Devoluções.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Foro</h2>
            <p className="mb-3">
              Nas relações comerciais entre empresas — compras destinadas à
              revenda — fica eleito o foro da comarca de Nova Friburgo/RJ.
            </p>
            <p>
              Nas compras realizadas por consumidor final, aplica-se o foro do
              domicílio do consumidor, nos termos do Código de Defesa do
              Consumidor.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
