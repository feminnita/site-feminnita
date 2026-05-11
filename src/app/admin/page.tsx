import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-12 w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">feminnita</h1>
          <p className="text-xl text-gray-600">Painel Administrativo</p>
          <div className="mt-4 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
            ✅ Clone do site Angê + Painel Admin Tray
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/" className="block">
            <button className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white py-5 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg">
              🏠 VER O SITE (Homepage)
            </button>
          </Link>

          <Link href="/admin/dashboard" className="block">
            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-5 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg">
              📊 DASHBOARD ADMIN
            </button>
          </Link>

          <Link href="/admin/produtos" className="block">
            <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-5 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg">
              📦 GESTÃO DE PRODUTOS
            </button>
          </Link>

          <Link href="/admin/pedidos" className="block">
            <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-5 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg">
              🛒 PEDIDOS
            </button>
          </Link>

          <Link href="/admin/configuracoes" className="block">
            <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-5 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg">
              ⚙️ CONFIGURAÇÕES
            </button>
          </Link>
        </div>

        <div className="mt-10 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
          <p className="text-sm text-blue-900 font-semibold mb-2">
            🎉 E-COMMERCE COMPLETO!
          </p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✅ Site clone do Angê com produtos e variações</li>
            <li>✅ Carrinho e checkout completo</li>
            <li>✅ Integração Melhor Envio</li>
            <li>✅ Facebook Pixel + Google Analytics</li>
            <li>✅ Carrinho abandonado + Email confirmação</li>
            <li>✅ Painel admin para configurações</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
