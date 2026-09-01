import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Garantia",
  description:
    "Garantia por defeito de fabricação de 30 dias corridos na Feminnita, conforme o Código de Defesa do Consumidor.",
  robots: { index: true, follow: true },
};

export default function TempoDeGarantiaPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">Garantia</h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Todas as peças passam por controle de qualidade antes de embarcar.
        </p>

        <div className="space-y-5 text-gray-700 leading-relaxed">
          <p>
            Ainda assim, se algo escapar, a garantia por{" "}
            <strong>defeito de fabricação é de 30 dias corridos</strong> a
            partir do recebimento — prazo do Código de Defesa do Consumidor para
            produtos não duráveis, que nós aplicamos a todas as peças.
          </p>
          <p>
            Não estão cobertos: desgaste natural do tecido, danos por lavagem
            fora das instruções da etiqueta, alterações feitas na peça e uso
            indevido.
          </p>
          <p>
            Para acionar a garantia, fale com a gente pelo WhatsApp (22)
            99281-0707 ou pelo e-mail fntlingerie@gmail.com, com o número do
            pedido e fotos da peça.
          </p>
        </div>
      </main>
    </div>
  );
}
