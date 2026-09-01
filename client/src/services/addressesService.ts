import { apiGet, apiPost, apiPut } from "./api";
import { API_URL } from "./api";
import type { Address, AddressInput } from "../types/account/account";

export async function fetchAddresses(): Promise<Address[]> {
    return (await apiGet<Address[]>("/api/store/addresses")) ?? [];
}

export async function setDefaultAddress(id: string): Promise<void> {
    await apiPut(`/api/store/addresses/${id}/default`);
}

export async function createAddress(input: AddressInput): Promise<void> {
    const created = (await apiPost<Address>("/api/store/addresses", {
        label: input.label,
        cep: input.cep,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
    })) as Address;

    if (input.isDefault && created?.id) await setDefaultAddress(created.id);
}

export async function updateAddress(id: string, input: AddressInput): Promise<void> {
    await apiPut(`/api/store/addresses/${id}`, {
        label: input.label,
        cep: input.cep,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
    });

    if (input.isDefault) await setDefaultAddress(id);
}

export async function deleteAddress(id: string): Promise<void> {
    await fetch(`${API_URL}/api/store/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
}