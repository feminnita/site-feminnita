"use client";

import { Header } from "../../components/layout/Header";
import { useAccount } from "../../hooks/count/useAccount";
import { ProfileForm } from "../../components/account/ProfileForm";
import { AddressManager } from "../../components/account/AddressManager";
import { OrderDetailModal } from "../../components/account/OrderDetailModal";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import type { AccountTab } from "../../types/account/account";
import {
    type LucideIcon,
    LogOut,
    MapPin,
    Package,
    User,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function MinhaContaContent() {
    const searchParams = useSearchParams();
    const [openOrderId, setOpenOrderId] = useState<string | null>(null);
    const cadastroOK = searchParams.get("cadastro") === "ok";

    const {
        email,
        customer,
        addresses,
        orders,
        tab,
        setTab,
        loading,
        logout,
        saveProfile,
        addAddress,
        editAddress,
        removeAddress,
    } = useAccount();

    if (loading) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="flex justify-center py-24">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
                </div>
            </div>
        );
    }

    const tabs: {
        id: AccountTab;
        label: string;
        icon: LucideIcon;
    }[] = [
            { id: "pedidos", label: "Meus Pedidos", icon: Package },
            { id: "dados", label: "Meus Dados", icon: User },
            { id: "enderecos", label: "Meus Endereços", icon: MapPin },
        ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto max-w-4xl px-4 py-10">
                {cadastroOK && (
                    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                        ✅ Conta criada com sucesso! Bem-vinda à Feminnita,{" "}
                        {customer?.name?.split(" ")[0] || ""}!
                    </div>
                )}

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Olá, {customer?.name?.split(" ")[0]}!
                        </h1>
                        <p className="text-sm text-gray-500">{email}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-red-600"
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === id
                                ? "bg-[#8C2F39] text-white"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Orders */}
                {tab === "pedidos" && (
                    <div>
                        {orders.length === 0 ? (
                            <div className="rounded-xl border border-gray-100 bg-white p-16 text-center shadow-sm">
                                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="mb-4 text-gray-500">
                                    Você ainda não fez nenhum pedido
                                </p>
                                <Link href="/produtos">
                                    <button className="rounded-lg bg-[#8C2F39] px-6 py-2 font-medium text-white hover:bg-[#7a2832]">
                                        Ver produtos
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        onClick={() => setOpenOrderId(order.id)}
                                        className="cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {order.orderNumber}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    {new Date(order.createdAt).toLocaleDateString(
                                                        "pt-BR",
                                                    )}
                                                </p>
                                                <div className="mt-2">
                                                    <OrderStatusBadge
                                                        status={order.status}
                                                        paymentStatus={order.paymentStatus}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#8C2F39]">
                                                    R${" "}
                                                    {order.total.toLocaleString("pt-BR", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {order.items?.length || 0} iten(s)
                                                </p>
                                            </div>
                                        </div>
                                        {order.items && order.items.length > 0 && (
                                            <div className="mt-3 space-y-1 border-t pt-3">
                                                {order.items.slice(0, 2).map((item) => (
                                                    <p key={item.id} className="text-xs text-gray-500">
                                                        {item.quantity}× {item.productName}
                                                        {item.size ? ` — ${item.size}` : ""}
                                                    </p>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <p className="text-xs text-gray-400">
                                                        +{order.items.length - 2} mais
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Profile data */}
                {tab === "dados" && customer && (
                    <ProfileForm customer={customer} onSave={saveProfile} />
                )}

                {/* Addresses */}
                {tab === "enderecos" && (
                    <AddressManager
                        addresses={addresses}
                        onAdd={addAddress}
                        onEdit={editAddress}
                        onDelete={removeAddress}
                    />
                )}
            </div>
            {openOrderId && (
                <OrderDetailModal
                    orderId={openOrderId}
                    onClose={() => setOpenOrderId(null)}
                />
            )}
        </div>
    );
}

export default function MinhaContaPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
                </div>
            }
        >
            <MinhaContaContent />
        </Suspense>
    );
}
