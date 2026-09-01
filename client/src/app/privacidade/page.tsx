import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a FNT Confecções Ltda, operadora da Feminnita, trata seus dados pessoais conforme a LGPD (Lei 13.709/2018).",
  robots: { index: true, follow: true },
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">
          Política de Privacidade
        </h1>
        <p className="mb-8 text-sm italic text-gray-500">
          Última atualização: 01/09/2026
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Esta política explica como a <strong>FNT Confecções Ltda</strong>,
            CNPJ 62.893.101/0001-96, operadora da loja Feminnita, trata os dados
            pessoais de quem usa este site — conforme a Lei Geral de Proteção de
            Dados (Lei 13.709/2018).
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Quem é o controlador dos seus dados
            </h2>
            <p>
              FNT Confecções Ltda — CNPJ 62.893.101/0001-96
              <br />
              Rua Marechal Rondon, 669 – A, Cônego, Nova Friburgo/RJ, CEP
              28.621-130
              <br />
              Contato para assuntos de privacidade:{" "}
              <strong>fntlingerie@gmail.com</strong> (assunto: LGPD)
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Que dados coletamos
            </h2>
            <p className="mb-3">
              <strong>Você nos fornece:</strong> nome, e-mail, telefone, CPF ou
              CNPJ, endereço de entrega e de cobrança, e a senha da sua conta.
            </p>
            <p className="mb-3">
              <strong>Coletamos automaticamente:</strong> endereço IP, tipo de
              navegador e dispositivo, páginas visitadas e produtos vistos, por
              meio de cookies e tecnologias semelhantes.
            </p>
            <p>
              <strong>Não coletamos dados do seu cartão.</strong> Eles vão
              direto para o gateway de pagamento.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Para que usamos, e com que base legal
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left">
                    <th className="py-2 pr-4 font-semibold">Para que</th>
                    <th className="py-2 font-semibold">Base legal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 pr-4">
                      Processar seu pedido, cobrar, emitir nota e entregar
                    </td>
                    <td className="py-2">Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 pr-4">
                      Enviar e-mails sobre o seu pedido (confirmação, envio,
                      rastreio)
                    </td>
                    <td className="py-2">Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 pr-4">
                      Guardar registros fiscais e contábeis
                    </td>
                    <td className="py-2">Obrigação legal</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 pr-4">
                      Enviar novidades, lançamentos e promoções
                    </td>
                    <td className="py-2">
                      Consentimento — você escolhe receber, e pode sair quando
                      quiser
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 pr-4">
                      Entender como o site é usado e melhorá-lo
                    </td>
                    <td className="py-2">Legítimo interesse</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Prevenir fraude</td>
                    <td className="py-2">Legítimo interesse</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Com quem compartilhamos
            </h2>
            <p className="mb-3">
              Apenas com quem é necessário para a compra acontecer:{" "}
              <strong>gateway de pagamento</strong>,{" "}
              <strong>transportadoras e Correios</strong>,{" "}
              <strong>serviço de envio de e-mail</strong>,{" "}
              <strong>ferramentas de análise de tráfego</strong> e{" "}
              <strong>contabilidade</strong>, além de autoridades quando a lei
              exigir.
            </p>
            <p>
              <strong>Nunca vendemos os seus dados.</strong>
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Por quanto tempo guardamos
            </h2>
            <p>
              Dados de pedido e nota fiscal: pelo prazo exigido pela legislação
              fiscal. Dados de cadastro: enquanto a sua conta existir. E-mail de
              newsletter: até você se descadastrar.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Seus direitos
            </h2>
            <p className="mb-3">
              A LGPD te garante: confirmar se tratamos seus dados, acessar,
              corrigir, pedir anonimização ou exclusão, pedir portabilidade,
              revogar o consentimento e se opor a um tratamento.
            </p>
            <p>
              Para exercer qualquer um deles, escreva para{" "}
              <strong>fntlingerie@gmail.com</strong> com o assunto{" "}
              <strong>LGPD</strong>. Respondemos em até 15 dias.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Cookies</h2>
            <p>
              Usamos cookies para manter o seu carrinho, lembrar a sua sessão,
              medir o uso do site e mostrar anúncios mais relevantes. Você pode
              bloquear cookies nas configurações do seu navegador, mas algumas
              funções da loja podem parar de funcionar.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Marketing por e-mail
            </h2>
            <p>
              Você só entra na nossa lista se pedir. Todo e-mail que enviamos tem
              link de descadastro que funciona, e sair leva um clique.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              Mudanças nesta política
            </h2>
            <p>
              Se mudarmos alguma coisa, a data de atualização no topo muda junto.
              Mudanças relevantes são avisadas por e-mail a quem tem conta.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
