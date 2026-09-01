"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Address, AddressInput } from "@/src/types/account/account";
import { useCep } from "../../hooks/count/useCep";

const EMPTY: AddressInput = {
    label: "Principal",
    cep: "",
    street: "",
    number: "",
    complement: null,
    neighborhood: "",
    city: "",
    state: "",
    isDefault: false,
};

export function AddressManager({
    addresses,
    onAdd,
    onEdit,
    onDelete,
}: {
    addresses: Address[];
    onAdd: (input: AddressInput) => Promise<void>;
    onEdit: (id: string, input: AddressInput) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<AddressInput | null>(null);
    const [saving, setSaving] = useState(false);

    const { lookup, loading: cepLoading } = useCep();

    const handleCep = async (value: string) => {
        set("cep", value);

        if (value.replace(/\D/g, "").length === 8) {
            const found = await lookup(value);

            if (found) {
                setForm((c) =>
                    c
                        ? {
                            ...c,
                            cep: found.cep,
                            street: found.logradouro,
                            neighborhood: found.bairro,
                            city: found.cidade,
                            state: found.uf,
                        }
                        : c,
                );
            }
        }
    };

    const openNew = () => {
        setEditingId(null);
        setForm(EMPTY);
    };

    const openEdit = (address: Address) => {
        setEditingId(address.id);
        setForm({
            label: address.label ?? "Principal",
            cep: address.cep,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            isDefault: address.isDefault ?? false,
        });
    };

    const close = () => {
        setForm(null);
        setEditingId(null);
    };

    function set<K extends keyof AddressInput>(field: K, value: AddressInput[K]) {
        setForm((a) => (a ? { ...a, [field]: value } : a));
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form) return;

        setSaving(true);

        try {
            if (editingId) await onEdit(editingId, form);
            else await onAdd(form);
            close();
        } finally {
            setSaving(false);
        }
    };

    const input =
        "w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-[#8C2F39]";

    return (
        <div>
            {/* Lista */}
            {addresses.length > 0 && (
                <div className="mb-4 grid gap-4 md:grid-cols-2">
                    {addresses.map((addr) => (
                        <div
                            key={addr.id}
                            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-[#8C2F39]" />
                                    <span className="text-sm font-medium">{addr.label}</span>
                                    {addr.isDefault && (
                                        <span className="rounded-full bg-[#8C2F39]/10 px-2 py-0.5 text-xs text-[#8C2F39]">
                                            Principal
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(addr)}
                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm("Excluir este endereço?")) onDelete(addr.id);
                                        }}
                                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700">
                                {addr.street}, {addr.number}
                            </p>
                            {addr.complement && (
                                <p className="text-sm text-gray-500">{addr.complement}</p>
                            )}
                            <p className="text-sm text-gray-700">{addr.neighborhood}</p>
                            <p className="text-sm text-gray-700">
                                {addr.city} — {addr.state}
                            </p>
                            <p className="text-sm text-gray-500">CEP: {addr.cep}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulário ou botão de adicionar */}
            {form ? (
                <form
                    onSubmit={submit}
                    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                    <h3 className="mb-4 font-bold">
                        {editingId ? "Editar endereço" : "Novo endereço"}
                    </h3>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                        <input
                            value={form.label}
                            onChange={(e) => set("label", e.target.value)}
                            placeholder="Rótulo (ex: Casa, Trabalho)"
                            className={input}
                        />
                        <input
                            value={form.cep}
                            onChange={(e) => handleCep(e.target.value)}
                            placeholder={cepLoading ? "Buscando endereço..." : "CEP *"}
                            required
                            className={input}
                        />
                        <input
                            value={form.street}
                            onChange={(e) => set("street", e.target.value)}
                            placeholder="Rua *"
                            required
                            className={input}
                        />
                        <input
                            value={form.number}
                            onChange={(e) => set("number", e.target.value)}
                            placeholder="Número *"
                            required
                            className={input}
                        />
                        <input
                            value={form.complement ?? ""}
                            onChange={(e) => set("complement", e.target.value)}
                            placeholder="Complemento"
                            className={input}
                        />
                        <input
                            value={form.neighborhood}
                            onChange={(e) => set("neighborhood", e.target.value)}
                            placeholder="Bairro *"
                            required
                            className={input}
                        />
                        <input
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            placeholder="Cidade *"
                            required
                            className={input}
                        />
                        <input
                            value={form.state}
                            onChange={(e) => set("state", e.target.value.toUpperCase())}
                            placeholder="UF *"
                            required
                            maxLength={2}
                            className={input}
                        />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.isDefault}
                            onChange={(e) => set("isDefault", e.target.checked)}
                            className="accent-[#8C2F39]"
                        />
                        Usar como endereço principal
                    </label>
                    <div className="mt-5 flex gap-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-[#8C2F39] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7a2832] disabled:opacity-50"
                        >
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className="rounded-lg border px-6 py-2.5 text-sm hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    type="button"
                    onClick={openNew}
                    className="flex items-center gap-2 rounded-lg bg-[#8C2F39] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7a2832]"
                >
                    <Plus size={16} /> Adicionar endereço
                </button>
            )}
        </div>
    );
}
