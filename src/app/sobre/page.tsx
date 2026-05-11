import { Header } from "@/components/Header";
import { Heart, Truck, Shield, Users } from "lucide-react";

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-light mb-6 text-center">Sobre a Feminnita</h1>
          <p className="text-xl text-gray-600 text-center mb-16">
            Moda fitness feminina com design inovador e qualidade excepcional
          </p>

          <div className="prose prose-lg max-w-none mb-16">
            <h2>Nossa História</h2>
            <p>
              A Feminnita nasceu da paixão por moda fitness e do desejo de criar peças
              que unem estilo, conforto e performance. Acreditamos que toda mulher
              merece se sentir confiante e linda durante seus treinos.
            </p>

            <h2>Nossa Missão</h2>
            <p>
              Empoderar mulheres através de roupas fitness de alta qualidade que
              valorizam todos os tipos de corpo e incentivam um estilo de vida saudável
              e ativo.
            </p>

            <h2>Nossos Valores</h2>
            <ul>
              <li><strong>Qualidade:</strong> Tecidos premium e acabamento perfeito</li>
              <li><strong>Conforto:</strong> Peças pensadas para máxima performance</li>
              <li><strong>Estilo:</strong> Designs exclusivos e modernos</li>
              <li><strong>Sustentabilidade:</strong> Compromisso com o meio ambiente</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-pink-600" size={32} />
              </div>
              <h3 className="font-semibold mb-2">Feito com Amor</h3>
              <p className="text-sm text-gray-600">
                Cada peça é desenvolvida com cuidado e atenção aos detalhes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-blue-600" size={32} />
              </div>
              <h3 className="font-semibold mb-2">Entrega Rápida</h3>
              <p className="text-sm text-gray-600">
                Enviamos para todo o Brasil com rapidez e segurança
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-green-600" size={32} />
              </div>
              <h3 className="font-semibold mb-2">Compra Segura</h3>
              <p className="text-sm text-gray-600">
                Ambiente 100% seguro e protegido para suas compras
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="font-semibold mb-2">Comunidade</h3>
              <p className="text-sm text-gray-600">
                Faça parte da nossa comunidade de mulheres inspiradoras
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h2 className="text-3xl font-light mb-4">Junte-se à Nossa Comunidade</h2>
            <p className="text-gray-600 mb-6">
              Siga-nos nas redes sociais e fique por dentro das novidades, dicas de treino
              e promoções exclusivas!
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://instagram.com/feminnita"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com/feminnita"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
