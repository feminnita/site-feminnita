import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Central de Ajuda da Feminnita — dúvidas frequentes, contato e links úteis.",
};

const links = [
  {
    href: "/como-comprar",
    title: "Como Comprar",
    desc: "Passo a passo do pedido, do carrinho ao pagamento.",
  },
  {
    href: "/envio-e-entrega",
    title: "Envio e Entrega",
    desc: "Frete por CEP, prazos, Correios e transportadora.",
  },
  {
    href: "/trocas-e-devolucoes",
    title: "Trocas e Devoluções",
    desc: "Quando a troca é possível e como solicitar.",
  },
  {
    href: "/politica-de-privacidade",
    title: "Política de Privacidade",
    desc: "Como tratamos os seus dados (LGPD).",
  },
  {
    href: "/termo-de-revenda",
    title: "Termo de Revenda",
    desc: "Condições para revenda dos produtos.",
  },
];

const faq = [
  {
    q: "Qual é o pedido mínimo?",
    a: "O pedido mínimo é de R$ 199, por se tratar de venda no atacado para revenda.",
  },
  {
    q: "Quais formas de pagamento vocês aceitam?",
    a: "Pix, boleto bancário e cartão de crédito em até 3x sem juros.",
  },
  {
    q: "Como é calculado o frete?",
    a: "O frete é calculado por CEP no checkout, com o custo e o prazo estimado exibidos antes de confirmar o pedido.",
  },
  {
    q: "Posso trocar ou devolver por arrependimento?",
    a: "Não. A venda é no atacado, então não há direito de arrependimento. A troca é aceita apenas em caso de divergência de pedido ou defeito de fabricação.",
  },
];

export default function CentralDeAjudaPage() {
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
            Central de Ajuda
          </h2>

          <div className="space-y-8 text-base leading-relaxed text-gray-700">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[#1A1A1A]">
                Como podemos ajudar?
              </h3>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block rounded-lg border border-gray-100 p-4 transition-colors hover:border-[#8C2F39]/40 hover:bg-[#FAF6F2]"
                    >
                      <span className="block font-semibold text-[#1A1A1A]">
                        {l.title}
                      </span>
                      <span className="block text-sm text-gray-600">
                        {l.desc}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[#1A1A1A]">
                Perguntas frequentes
              </h3>
              <div className="space-y-4">
                {faq.map((item) => (
                  <div key={item.q}>
                    <p className="font-medium text-[#1A1A1A]">{item.q}</p>
                    <p className="text-gray-600">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Fale com a gente
              </h3>
              <ul className="space-y-1">
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
                <li>Segunda a quinta: 8h às 17h · Sexta: 8h às 16h</li>
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
