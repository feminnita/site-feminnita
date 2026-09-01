import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/sobre-a-empresa", label: "Sobre a empresa" },
  { href: "/como-comprar", label: "Como comprar" },
  { href: "/pagamento", label: "Formas de pagamento" },
  { href: "/envio", label: "Envio e entrega" },
  { href: "/trocas-e-devolucoes", label: "Trocas e devoluções" },
  { href: "/tempo-de-garantia", label: "Garantia" },
  { href: "/perguntas-frequentes", label: "Perguntas frequentes" },
  { href: "/seguranca", label: "Segurança" },
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/contato", label: "Contato" },
];

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-light tracking-wider text-[#8C2F39]">
              Feminnita
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Loja operada por <strong>FNT Confecções Ltda</strong>, CNPJ
              62.893.101/0001-96, Inscrição Estadual 15.835.73-7.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Rua Marechal Rondon, 669 – A, Cônego, Nova Friburgo/RJ, CEP
              28.621-130.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Atendimento: (22) 99281-0707 · fntlingerie@gmail.com · segunda a
              sexta, das 8h às 17h.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-800">Institucional</h4>
            <ul className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-gray-600">
            A cobrança no seu cartão ou no seu extrato aparecerá como{" "}
            <strong>FNT</strong>.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            © 2026 Feminnita — FNT Confecções Ltda. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
