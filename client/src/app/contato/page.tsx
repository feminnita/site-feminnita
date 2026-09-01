import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";
import { ContactForm } from "../../components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Feminnita: WhatsApp (22) 99281-0707, fntlingerie@gmail.com, atendimento de segunda a sexta das 8h às 17h.",
  robots: { index: true, follow: true },
};

export default function ContatoPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">Contato</h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Fale com a gente.
        </p>

        <div className="mb-10 space-y-5 text-gray-700 leading-relaxed">
          <p>
            <strong>WhatsApp e telefone:</strong> (22) 99281-0707
            <br />
            <strong>E-mail:</strong> fntlingerie@gmail.com
            <br />
            <strong>Atendimento:</strong> segunda a sexta, das 8h às 17h
          </p>

          <div>
            <p className="font-semibold text-gray-800">Endereço:</p>
            <p>
              Rua Marechal Rondon, 669 – A
              <br />
              Cônego — Nova Friburgo/RJ
              <br />
              CEP 28.621-130
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-800">Dados da empresa:</p>
            <p>
              FNT Confecções Ltda
              <br />
              CNPJ 62.893.101/0001-96
              <br />
              Inscrição Estadual 15.835.73-7
            </p>
          </div>

          <p>
            Para assuntos de privacidade e proteção de dados — pedir uma cópia
            dos seus dados, corrigir ou solicitar exclusão — use o mesmo
            e-mail, com o assunto &quot;LGPD&quot;.
          </p>
        </div>

        <h2 className="mb-4 text-xl font-medium text-gray-800">
          Envie uma mensagem
        </h2>
        <ContactForm />
      </main>
    </div>
  );
}
