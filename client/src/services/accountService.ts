import { apiGet, apiPut } from "./api";
import type { AccountCustomer, CustomerUpdate } from "../types/account/account";

export function fetchProfile(): Promise<AccountCustomer | null> {
    return apiGet<AccountCustomer>("/api/store/account");
}

export async function updateProfile(data: CustomerUpdate): Promise<AccountCustomer> {
    return (await apiPut<AccountCustomer>("/api/store/account", data)) as AccountCustomer;
}