"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ExternalLink } from "lucide-react";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  const [config, setConfig] = useState({
    // Marketing
    googleAnalyticsId: "G-XXXXXXXXXX",
    googleTagManagerId: "GTM-XXXXXXX",
    facebookPixelId: "SEU_PIXEL_ID_AQUI",
    hotjarId: "XXXXXX",

    // Melhor Envio
    melhorEnvioToken: "",
    melhorEnvioSandbox: true,

    // Email
    emailProvider: "smtp",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    emailFrom: "pedidos@feminnita.com.br",

    // Store
    storeName: "Feminnita",
    storePhone: "(21) 99999-9999",
    storeEmail: "contato@feminnita.com.br",
    storeCnpj: "",

    // Shipping
    freeShippingMinValue: 299,
    defaultWeight: 0.3, // kg
    defaultHeight: 10, // cm
    defaultWidth: 20, // cm
    defaultLength: 30, // cm
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("adminAuth");
    if (!isAuth) {
      router.push("/admin");
      return;
    }

    // Load saved config
    const savedConfig = localStorage.getItem("siteConfig");
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setConfig({
      ...config,
      [name]: type === "number" ? parseFloat(value) || 0 : finalValue,
    });
  };

  const handleSave = () => {
    localStorage.setItem("siteConfig", JSON.stringify(config));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    alert("Configurações salvas com sucesso! Para aplicar os pixels, atualize o código no arquivo layout.tsx com os IDs configurados.");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Configurações</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Marketing & Analytics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Marketing & Analytics</h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure os IDs das ferramentas de marketing e analytics. Após salvar, você precisará atualizar
              o arquivo <code className="bg-gray-100 px-2 py-1 rounded">src/app/layout.tsx</code> com os IDs configurados.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Google Analytics 4 ID
                </label>
                <input
                  type="text"
                  name="googleAnalyticsId"
                  value={config.googleAnalyticsId}
                  onChange={handleChange}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <a
                  href="https://analytics.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Obter ID <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  name="googleTagManagerId"
                  value={config.googleTagManagerId}
                  onChange={handleChange}
                  placeholder="GTM-XXXXXXX"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <a
                  href="https://tagmanager.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Obter ID <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  name="facebookPixelId"
                  value={config.facebookPixelId}
                  onChange={handleChange}
                  placeholder="1234567890123456"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <a
                  href="https://business.facebook.com/events_manager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Obter Pixel ID <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Hotjar ID
                </label>
                <input
                  type="text"
                  name="hotjarId"
                  value={config.hotjarId}
                  onChange={handleChange}
                  placeholder="XXXXXX"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <a
                  href="https://insights.hotjar.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Obter ID <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Melhor Envio */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📦 Melhor Envio</h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure a integração com Melhor Envio para cálculo de frete e geração de etiquetas.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Token de API
                </label>
                <input
                  type="password"
                  name="melhorEnvioToken"
                  value={config.melhorEnvioToken}
                  onChange={handleChange}
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGc..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <a
                  href="https://melhorenvio.com.br/painel/gerenciar/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Gerar Token no Melhor Envio <ExternalLink size={12} />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="melhorEnvioSandbox"
                  checked={config.melhorEnvioSandbox}
                  onChange={(e) => setConfig({ ...config, melhorEnvioSandbox: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">
                  Usar modo Sandbox (ambiente de testes)
                </label>
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📧 Configurações de E-mail</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Provedor de E-mail
                </label>
                <select
                  name="emailProvider"
                  value={config.emailProvider}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  name="smtpHost"
                  value={config.smtpHost}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SMTP Port
                </label>
                <input
                  type="text"
                  name="smtpPort"
                  value={config.smtpPort}
                  onChange={handleChange}
                  placeholder="587"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SMTP User
                </label>
                <input
                  type="text"
                  name="smtpUser"
                  value={config.smtpUser}
                  onChange={handleChange}
                  placeholder="seu-email@gmail.com"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  name="smtpPassword"
                  value={config.smtpPassword}
                  onChange={handleChange}
                  placeholder="sua-senha-de-app"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  E-mail Remetente
                </label>
                <input
                  type="email"
                  name="emailFrom"
                  value={config.emailFrom}
                  onChange={handleChange}
                  placeholder="pedidos@feminnita.com.br"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Store Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏪 Dados da Loja</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={config.storeName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  name="storePhone"
                  value={config.storePhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  name="storeEmail"
                  value={config.storeEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  name="storeCnpj"
                  value={config.storeCnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Shipping Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🚚 Configurações de Frete</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Valor Mínimo para Frete Grátis (R$)
                </label>
                <input
                  type="number"
                  name="freeShippingMinValue"
                  value={config.freeShippingMinValue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Peso Padrão (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="defaultWeight"
                  value={config.defaultWeight}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Altura Padrão (cm)
                </label>
                <input
                  type="number"
                  name="defaultHeight"
                  value={config.defaultHeight}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Largura Padrão (cm)
                </label>
                <input
                  type="number"
                  name="defaultWidth"
                  value={config.defaultWidth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Comprimento Padrão (cm)
                </label>
                <input
                  type="number"
                  name="defaultLength"
                  value={config.defaultLength}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {isSaved ? "✓ Salvo com Sucesso!" : "Salvar Configurações"}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">📘 Como Usar</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Configure todos os IDs das ferramentas de marketing acima</li>
              <li>Clique em "Salvar Configurações"</li>
              <li>Abra o arquivo <code className="bg-blue-100 px-2 py-1 rounded">src/app/layout.tsx</code></li>
              <li>Substitua os placeholders (G-XXXXXXXXXX, GTM-XXXXXXX, etc) pelos IDs configurados</li>
              <li>As integrações estarão ativas após reiniciar o servidor</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
