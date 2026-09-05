import Link from "next/link";

// Rodapé GLOBAL — renderizado no ClientBody, aparece em todas as páginas uma
// única vez. Dados de contato reais da Feminnita. Formas de pagamento em texto
// (sem logos externas: a CSP bloqueia imagens de terceiros).
export function Footer() {
  return (
    <footer className="border-t bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          {/* Marca + blurb */}
          <div>
            <h3 className="mb-4 text-xl font-bold">Feminnita</h3>
            <p className="text-sm text-gray-600">
              Pijamas e moda íntima feminina — atacado direto da fábrica,
              pedido mínimo R$ 199.
            </p>
          </div>

          {/* Ajuda */}
          <div>
            <h4 className="mb-4 font-semibold">Ajuda</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/central-de-ajuda" className="hover:underline">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link href="/trocas-e-devolucoes" className="hover:underline">
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link href="/envio-e-entrega" className="hover:underline">
                  Envio e Entrega
                </Link>
              </li>
              <li>
                <Link href="/como-comprar" className="hover:underline">
                  Como Comprar
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-de-privacidade"
                  className="hover:underline"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termo-de-revenda" className="hover:underline">
                  Termo de Revenda
                </Link>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h4 className="mb-4 font-semibold">Atendimento</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href="https://wa.me/5522992810707"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  WhatsApp: (22) 99281-0707
                </a>
              </li>
              <li>
                <a
                  href="mailto:feminnita@gmail.com"
                  className="hover:underline"
                >
                  Email: feminnita@gmail.com
                </a>
              </li>
              <li>Seg a Qui: 8h às 17h</li>
              <li>Sex: 8h às 16h</li>
            </ul>
          </div>

          {/* Formas de pagamento */}
          <div>
            <h4 className="mb-4 font-semibold">Formas de pagamento</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="inline-block rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                  Pix
                </span>
                <span>à vista</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                  Boleto
                </span>
                <span>bancário</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                  Cartão
                </span>
                <span>em até 3x sem juros</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center">
          <p className="text-sm text-gray-600">
            © 2026 Feminnita. Todos os direitos reservados.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <a
              href="https://www.facebook.com/feminnita/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook da Feminnita"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/feminnita/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Feminnita"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
