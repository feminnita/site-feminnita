import { apiGet } from "./api";

export async function fetchSettings(): Promise<Record<string, any> | null> {
    return apiGet<Record<string, any>>("/api/store/settings");
}
