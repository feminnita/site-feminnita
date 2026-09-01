import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Cupons de desconto",
  description:
    "Cupons ativos da loja Feminnita. Cadastre seu e-mail para receber lançamentos e condições especiais antes de todo mundo.",
  robots: { index: true, follow: true },
};

export default function CuponsDeDescontoPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">
          Cupons de desconto
        </h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Cupons Feminnita
        </p>

        <div className="space-y-5 text-gray-700 leading-relaxed">
          <p>
            Aqui ficam os cupons ativos da loja. Quando houver um, ele aparece
            nesta página com o código e as regras de uso.
          </p>
          <p className="italic text-gray-500">
            No momento não há cupons disponíveis.
          </p>
          <p>
            Quer saber primeiro quando sair um? <strong>Cadastre seu e-mail</strong>{" "}
            e receba os lançamentos e as condições especiais antes de irem para o
            site.
          </p>
        </div>
      </main>
    </div>
  );
}
