import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Sobre a empresa",
  description:
    "Feminnita é uma fábrica de pijamas femininos no atacado em Nova Friburgo/RJ, operada por FNT Confecções Ltda. Conheça a marca.",
  robots: { index: true, follow: true },
};

export default function SobreAEmpresaPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">
          Sobre a empresa
        </h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Fábrica de pijamas em Nova Friburgo, para quem revende.
        </p>

        <div className="space-y-5 text-gray-700 leading-relaxed">
          <p>
            A Feminnita é uma marca de pijamas femininos vendidos no atacado, do
            infantil ao plus size. Fabricamos em Nova Friburgo, no Rio de
            Janeiro, e vendemos direto para lojistas e revendedoras de todo o
            Brasil.
          </p>
          <p>
            Trabalhamos principalmente com <strong>tecido suede</strong>,
            escolhido pelo toque macio e pelo caimento, e desenvolvemos modelos
            novos ao longo do ano para acompanhar o que a sua cliente procura em
            cada estação.
          </p>
          <p>
            O pedido mínimo é de <strong>R$ 199</strong>, e pode ser montado com
            modelos, cores e tamanhos sortidos — você não precisa levar
            quantidade de uma peça só para atingir o mínimo.
          </p>
          <p>
            Fabricar por conta própria nos permite três coisas que fazem
            diferença para quem revende: preço de fábrica sem intermediário,
            reposição rápida do que vende bem, e controle de qualidade peça por
            peça antes do envio.
          </p>
          <p>
            A loja é operada por <strong>FNT Confecções Ltda</strong>, CNPJ
            62.893.101/0001-96.
          </p>
        </div>
      </main>
    </div>
  );
}
