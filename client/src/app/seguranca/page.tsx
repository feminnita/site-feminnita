import type { Metadata } from "next";
import { Header } from "../../components/layout/Header";

export const metadata: Metadata = {
  title: "Segurança",
  description:
    "O site da Feminnita usa conexão criptografada (HTTPS/SSL) e não armazena dados de cartão de crédito. Saiba como protegemos seus dados.",
  robots: { index: true, follow: true },
};

export default function SegurancaPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-light text-[#8C2F39]">Segurança</h1>
        <p className="mb-8 text-lg font-medium text-gray-800">
          Seus dados e seu pagamento.
        </p>

        <div className="space-y-5 text-gray-700 leading-relaxed">
          <p>
            Todo o site funciona sobre conexão criptografada (HTTPS/SSL). Isso
            significa que as informações que você digita — endereço, dados de
            pagamento, senha — trafegam protegidas entre o seu navegador e a
            nossa loja.
          </p>
          <p>
            <strong>Não armazenamos dados de cartão de crédito.</strong> O
            pagamento é processado por gateway certificado, e os dados do cartão
            vão direto para ele.
          </p>
          <p>
            Os seus dados de cadastro e de pedido são usados apenas para
            processar e entregar a sua compra, e para a comunicação sobre ela.{" "}
            <strong>
              Não vendemos, alugamos nem cedemos seus dados a terceiros
            </strong>{" "}
            para fins comerciais.
          </p>
          <p>
            Detalhes completos sobre o que coletamos, por quê e por quanto tempo
            estão na <strong>Política de Privacidade</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}
