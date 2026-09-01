import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Dúvidas sobre pedidos, entrega, pagamento, trocas e revenda na Feminnita. Confira as perguntas mais comuns.",
  robots: { index: true, follow: true },
};

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-gray-800">{q}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

export default function PerguntasFrequentesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-light text-[#8C2F39]">
          Perguntas frequentes
        </h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="mb-4 text-xl font-medium text-[#8C2F39]">Pedidos</h2>
            <div className="space-y-5">
              <QA q="Qual o pedido mínimo?">
                R$ 199, podendo ser em modelos, cores e tamanhos sortidos.
              </QA>
              <QA q="Posso comprar com CPF?">
                Sim. Aceitamos CPF e CNPJ.
              </QA>
              <QA q="Consigo acompanhar meu pedido?">
                Sim, em <strong>Minha conta → Meus pedidos</strong>. Você também
                recebe atualizações por e-mail.
              </QA>
              <QA q="Posso adicionar um produto a um pedido já feito?">
                Não. Depois de finalizado, o pedido não é alterado — é preciso
                fazer um novo.
              </QA>
              <QA q="Como sei se um produto está em estoque?">
                Se ele pode ser adicionado ao carrinho e finalizado, há estoque.
              </QA>
              <QA q="Não recebi todos os itens. E agora?">
                Fale com a gente pelo WhatsApp (22) 99281-0707 ou por
                fntlingerie@gmail.com, com o número do pedido.
              </QA>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-[#8C2F39]">Entrega</h2>
            <div className="space-y-5">
              <QA q="Quem entrega?">
                Correios e transportadoras parceiras. As opções aparecem no
                carrinho, com prazo e valor.
              </QA>
              <QA q="Quanto tempo para postar?">
                Assim que o pagamento é confirmado. Pix e cartão confirmam na
                hora; boleto leva de 1 a 3 dias úteis.
              </QA>
              <QA q="Outra pessoa pode receber?">
                Sim, desde que maior de idade, com documento, assinando o
                protocolo.
              </QA>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-[#8C2F39]">
              Pagamento
            </h2>
            <div className="space-y-5">
              <QA q="Quais as formas de pagamento?">
                Pix com 5% de desconto, cartão em até 3x sem juros, e boleto.
              </QA>
              <QA q="Vocês guardam meu cartão?">
                Não. Os dados vão direto para o gateway de pagamento.
              </QA>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-[#8C2F39]">Trocas</h2>
            <div className="space-y-5">
              <QA q="Qual o prazo para trocar?">
                7 dias corridos do recebimento para arrependimento ou troca; 30
                dias para defeito de fabricação.
              </QA>
              <QA q="Quem paga o frete da troca?">
                Depende da destinação da compra. Se você comprou{" "}
                <strong>como consumidora final, para uso próprio</strong>, o
                arrependimento em 7 dias é sem custo — devolvemos os valores
                pagos, frete incluído. Se comprou <strong>para revenda</strong>,
                a devolução por desistência depende de autorização nossa e o
                frete de retorno é por sua conta. <strong>Em qualquer caso</strong>
                , defeito de fabricação, item errado ou erro nosso: o custo é
                nosso.
              </QA>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-[#8C2F39]">Revenda</h2>
            <div className="space-y-5">
              <QA q="Preciso ter loja física?">Não.</QA>
              <QA q="Posso usar as fotos do site para divulgar?">
                Pode, à vontade — são suas para vender as peças que comprou.
              </QA>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
