import Link from "next/link";
import productsData from "@/data/products.json";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Feminnita</h1>
          <Link href="/" className="text-blue-600 hover:underline">← Voltar ao site</Link>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total de Produtos</div>
            <div className="text-3xl font-bold mt-2">{productsData.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pedidos</div>
            <div className="text-3xl font-bold mt-2">0</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Receita Total</div>
            <div className="text-3xl font-bold mt-2">R$ 0,00</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/produtos" className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 p-4 rounded-lg font-semibold text-center">
              📦 Gerenciar Produtos
            </Link>
            <Link href="/admin/pedidos" className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 p-4 rounded-lg font-semibold text-center">
              🛒 Ver Pedidos
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-900 mb-2">✅ Sistema Funcionando!</h3>
          <p className="text-sm text-green-800">
            Este é o painel administrativo do clone do site Angê.
            Edite seus produtos em <code className="bg-green-100 px-2 py-1 rounded">src/data/products.json</code>
          </p>
        </div>
      </main>
    </div>
  );
}
