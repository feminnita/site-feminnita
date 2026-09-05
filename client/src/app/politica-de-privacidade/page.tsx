import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade da Feminnita — como coletamos, usamos e protegemos os seus dados (LGPD).",
};

export default function PoliticaDePrivacidadePage() {
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
            Política de Privacidade
          </h2>

          <div className="space-y-6 text-base leading-relaxed text-gray-700">
            <p>
              Esta Política descreve como a Feminnita coleta, utiliza,
              compartilha e protege os dados pessoais dos seus clientes, em
              conformidade com a Lei Geral de Proteção de Dados (Lei nº
              13.709/2018 — LGPD).
            </p>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                1. Dados que coletamos
              </h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>Nome</li>
                <li>E-mail</li>
                <li>WhatsApp / telefone</li>
                <li>Endereço de entrega</li>
                <li>
                  Dados de pagamento — processados diretamente pelo gateway{" "}
                  <strong>Mercado Pago</strong>. A Feminnita não armazena os
                  dados do cartão.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                2. Finalidade do tratamento
              </h3>
              <p>Utilizamos os dados para:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Processar e entregar os pedidos;</li>
                <li>Calcular o frete e emitir a nota fiscal;</li>
                <li>Prestar atendimento e suporte;</li>
                <li>Cumprir obrigações legais e fiscais.</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                3. Compartilhamento de dados
              </h3>
              <p>
                Compartilhamos dados apenas na medida necessária para concluir a
                compra:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Transportadora / Correios:</strong> nome e endereço,
                  para a entrega do pedido;
                </li>
                <li>
                  <strong>Gateway de pagamento (Mercado Pago):</strong> dados
                  necessários para processar o pagamento.
                </li>
              </ul>
              <p className="mt-2">
                Não vendemos nem cedemos dados pessoais para fins de marketing de
                terceiros.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                4. Direitos do titular
              </h3>
              <p>
                Você pode solicitar, a qualquer momento, o{" "}
                <strong>acesso</strong>, a <strong>correção</strong> ou a{" "}
                <strong>exclusão</strong> dos seus dados, além de confirmar a
                existência de tratamento. Basta entrar em contato pelos canais
                informados abaixo.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                5. Cookies
              </h3>
              <p>
                Utilizamos cookies e tecnologias semelhantes para manter o
                funcionamento do site (carrinho, sessão) e para medir audiência e
                desempenho. Você pode gerenciar os cookies nas configurações do
                seu navegador.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                6. Contato do controlador
              </h3>
              <p>
                Controlador dos dados:{" "}
                <strong>[RAZÃO SOCIAL / CNPJ — preencher]</strong>.
              </p>
              <p className="mt-2">
                Para exercer os seus direitos ou tirar dúvidas sobre esta
                Política, fale com a gente:
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  WhatsApp:{" "}
                  <a
                    href="https://wa.me/5522992810707"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8C2F39] hover:underline"
                  >
                    (22) 99281-0707
                  </a>
                </li>
                <li>
                  E-mail:{" "}
                  <a
                    href="mailto:feminnita@gmail.com"
                    className="text-[#8C2F39] hover:underline"
                  >
                    feminnita@gmail.com
                  </a>
                </li>
              </ul>
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
