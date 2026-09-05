import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trocas e Devoluções",
  description:
    "Política de trocas e devoluções da Feminnita — venda no atacado para revendedoras.",
};

export default function TrocasEDevolucoesPage() {
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
            Trocas e Devoluções
          </h2>

          <div className="space-y-6 text-base leading-relaxed text-gray-700">
            <p>
              A Feminnita comercializa <strong>no atacado</strong>, para
              revendedoras e lojistas. Por não se tratar de venda no varejo ao
              consumidor final, <strong>não há direito de arrependimento</strong>{" "}
              e <strong>não é oferecida a devolução</strong> de mercadoria que
              não tenha sido vendida.
            </p>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Quando a troca é possível
              </h3>
              <p>A troca é aceita apenas em duas situações:</p>
              <ol className="mt-3 list-decimal space-y-3 pl-5">
                <li>
                  <strong>Divergência de quantidade, tamanho ou cor:</strong>{" "}
                  avise em até <strong>3 dias úteis</strong> após o recebimento,
                  enviando foto da embalagem e das peças.
                </li>
                <li>
                  <strong>Defeito de fabricação:</strong> a peça deve estar{" "}
                  <strong>sem uso, com etiqueta</strong>, acompanhada de foto que
                  mostre o defeito.
                </li>
              </ol>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                O que não é trocado
              </h3>
              <p>
                Peças <strong>usadas, lavadas ou sem etiqueta</strong> não são
                trocadas. Também não há troca por arrependimento nem devolução de
                mercadoria não vendida.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Frete
              </h3>
              <p>
                O frete é calculado por CEP e enviado por Correios e
                transportadora.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                Como solicitar
              </h3>
              <p>
                Fale com o nosso atendimento pelo WhatsApp{" "}
                <a
                  href="https://wa.me/5522992810707"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8C2F39] hover:underline"
                >
                  (22) 99281-0707
                </a>{" "}
                ou pelo e-mail{" "}
                <a
                  href="mailto:feminnita@gmail.com"
                  className="text-[#8C2F39] hover:underline"
                >
                  feminnita@gmail.com
                </a>
                . Atendimento de segunda a quinta, das 8h às 17h, e sexta, das 8h
                às 16h.
              </p>
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
