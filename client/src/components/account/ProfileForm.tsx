"use client";

import { useState } from "react";
import type { AccountCustomer, CustomerUpdate } from "@/src/types/account/account";

export function ProfileForm({
    customer,
    onSave,
}: {
    customer: AccountCustomer;
    onSave: (data: CustomerUpdate) => Promise<void>;
}) {
    const [form, setForm] = useState<CustomerUpdate>({
        name: customer.name,
        phone: customer.phone,
        cpf: customer.cpf,
        birthDate: customer.birthDate,
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const set = (field: keyof CustomerUpdate, value: string) => {
        setSaved(false);
        setForm((data) => ({ ...data, [field]: value || null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await onSave(form);
            setSaved(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
        >
            <h2 className="mb-5 text-lg font-bold">Meus Dados</h2>
            <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-gray-500">Nome completo</label>
                    <input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-[#8C2F39]"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-gray-500">E-mail</label>
                    <input
                        value={customer.email}
                        disabled
                        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-gray-400"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-gray-500">Telefone</label>
                    <input
                        value={form.phone ?? ""}
                        onChange={(e) => set("phone", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-[#8C2F39]"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-gray-500">CPF</label>
                    <input
                        value={form.cpf ?? ""}
                        onChange={(e) => set("cpf", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-[#8C2F39]"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-gray-500">Data de nascimento</label>
                    <input
                        type="date"
                        value={form.birthDate ?? ""}
                        onChange={(e) => set("birthDate", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-[#8C2F39]"
                    />
                </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#8C2F39] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7a2832] disabled:opacity-50"
                >
                    {saving ? "Salvando..." : "Salvar alterações"}
                </button>
                {saved && (
                    <span className="text-sm text-green-600">✓ Dados atualizados</span>
                )}
            </div>
        </form>
    );
}
