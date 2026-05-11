"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Search, Filter, Eye, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = () => {
    const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(savedOrders);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle },
      shipped: { label: "Enviado", color: "bg-blue-100 text-blue-800", icon: Truck },
      delivered: { label: "Entregue", color: "bg-purple-100 text-purple-800", icon: Package },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
    };
    return statusMap[status] || statusMap.pending;
  };

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total de Pedidos</div>
            <div className="text-3xl font-bold mt-2">{orders.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pendentes</div>
            <div className="text-3xl font-bold mt-2 text-yellow-600">
              {orders.filter((o) => o.status === "pending").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pagos</div>
            <div className="text-3xl font-bold mt-2 text-green-600">
              {orders.filter((o) => o.status === "paid").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Receita Total</div>
            <div className="text-2xl font-bold mt-2">
              R$ {totalRevenue.toFixed(2).replace(".", ",")}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Filters */}
              <div className="p-6 border-b">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar por ID, nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendente</option>
                      <option value="paid">Pago</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Nenhum pedido encontrado</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div
                        key={order.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedOrder?.id === order.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg">#{order.id}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} flex items-center gap-1`}>
                                <StatusIcon size={14} />
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{order.customer.name}</p>
                            <p className="text-sm text-gray-500">{order.customer.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(order.date).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">
                              R$ {order.total.toFixed(2).replace(".", ",")}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Eye size={20} />
                  Detalhes do Pedido
                </h3>

                <div className="space-y-4">
                  {/* Order ID */}
                  <div>
                    <p className="text-xs text-gray-500">Pedido</p>
                    <p className="font-bold text-lg">#{selectedOrder.id}</p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Status</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-medium"
                    >
                      <option value="pending">Pendente</option>
                      <option value="paid">Pago</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  {/* Customer */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2">Cliente</p>
                    <p className="font-medium">{selectedOrder.customer.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customer.email}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                  </div>

                  {/* Address */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2">Endereço de Entrega</p>
                    <p className="text-sm">
                      {selectedOrder.customer.street}, {selectedOrder.customer.number}
                    </p>
                    {selectedOrder.customer.complement && (
                      <p className="text-sm">{selectedOrder.customer.complement}</p>
                    )}
                    <p className="text-sm">
                      {selectedOrder.customer.neighborhood} - {selectedOrder.customer.city}/{selectedOrder.customer.state}
                    </p>
                    <p className="text-sm">CEP: {selectedOrder.customer.cep}</p>
                  </div>

                  {/* Items */}
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

                  {/* Payment */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2">Pagamento</p>
                    <p className="text-sm font-medium">
                      {selectedOrder.paymentMethod === "pix" && "PIX"}
                      {selectedOrder.paymentMethod === "boleto" && "Boleto Bancário"}
                      {selectedOrder.paymentMethod === "card" && "Cartão de Crédito"}
                    </p>
                  </div>

                  {/* Total */}
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
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
                <Package size={48} className="mx-auto mb-4" />
                <p>Selecione um pedido para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
