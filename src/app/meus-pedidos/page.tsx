"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Package, Eye, Truck, CheckCircle, Clock, XCircle, Search } from "lucide-react";

export default function MeusPedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm]);

  const loadOrders = () => {
    const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(savedOrders);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter((order) =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredOrders(filtered);
  };

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      pending: { label: "Pagamento Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      paid: { label: "Pago - Em Separação", color: "bg-green-100 text-green-800", icon: CheckCircle },
      shipped: { label: "Enviado", color: "bg-blue-100 text-blue-800", icon: Truck },
      delivered: { label: "Entregue", color: "bg-purple-100 text-purple-800", icon: Package },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
    };
    return statusMap[status] || statusMap.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-light mb-8">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-light mb-4">Você ainda não fez nenhum pedido</h2>
            <p className="text-gray-600 mb-6">Explore nossa coleção e encontre o look perfeito para seus treinos!</p>
            <Link href="/">
              <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800">
                Começar a Comprar
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por número do pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Orders */}
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.color} flex items-center gap-2`}>
                        <StatusIcon size={16} />
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Items Preview */}
                    <div className="border-t border-b py-4 mb-4">
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.name} ({item.selectedColor})
                            </span>
                            <span className="font-medium">
                              R$ {(item.pixPrice * item.quantity).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-500">
                            + {order.items.length - 2} {order.items.length - 2 === 1 ? "item" : "itens"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total & Actions */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold">
                          R$ {order.total.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center gap-2"
                      >
                        <Eye size={18} />
                        Ver Detalhes
                      </button>
                    </div>

                    {/* Tracking */}
                    {order.status === "shipped" && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900 font-semibold mb-2">
                          📦 Pedido em Trânsito
                        </p>
                        <p className="text-sm text-blue-800 mb-2">
                          Código de rastreamento: <strong>BR123456789BR</strong>
                        </p>
                        <a
                          href="https://rastreamento.correios.com.br/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Rastrear Pedido →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Order Details Sidebar */}
            <div className="lg:col-span-1">
              {selectedOrder ? (
                <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold">Detalhes</h3>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Pedido</p>
                      <p className="font-bold">#{selectedOrder.id}</p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500 mb-2">Endereço de Entrega</p>
                      <p className="text-sm">
                        {selectedOrder.customer.street}, {selectedOrder.customer.number}
                      </p>
                      {selectedOrder.customer.complement && (
                        <p className="text-sm">{selectedOrder.customer.complement}</p>
                      )}
                      <p className="text-sm">
                        {selectedOrder.customer.neighborhood}
                      </p>
                      <p className="text-sm">
                        {selectedOrder.customer.city}/{selectedOrder.customer.state}
                      </p>
                      <p className="text-sm">CEP: {selectedOrder.customer.cep}</p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500 mb-2">Itens</p>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item: any, index: number) => (
                          <div key={index} className="text-sm flex justify-between">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium">
                              R$ {(item.pixPrice * item.quantity).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Subtotal</span>
                        <span>R$ {selectedOrder.subtotal.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Frete</span>
                        <span>R$ {selectedOrder.shipping.toFixed(2).replace(".", ",")}</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 mb-1">
                          <span>Desconto</span>
                          <span>- R$ {selectedOrder.discount.toFixed(2).replace(".", ",")}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                        <span>Total</span>
                        <span>R$ {selectedOrder.total.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>

                    {selectedOrder.status === "pending" && (
                      <Link href={`/pedido-confirmado?id=${selectedOrder.id}`}>
                        <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 mt-4">
                          Ver Instruções de Pagamento
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400 sticky top-4">
                  <Package size={48} className="mx-auto mb-4" />
                  <p>Selecione um pedido para ver os detalhes</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
