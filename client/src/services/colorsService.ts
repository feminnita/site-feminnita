import { apiGet } from "./api";
import type { ColorSwatch } from "../types/colors/colors";

export async function fetchColorSwatches(): Promise<ColorSwatch[]> {
    return (await apiGet<ColorSwatch[]>("/api/store/colors")) ?? [];
}