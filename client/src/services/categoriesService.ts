import { apiGet } from "./api";
import type { CategoryRow } from "../types/categories/categories";

export async function fetchCategories(): Promise<CategoryRow[]> {
    return (await apiGet<CategoryRow[]>("/api/store/categories")) ?? [];
}
