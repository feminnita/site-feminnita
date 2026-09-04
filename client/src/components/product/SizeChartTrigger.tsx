"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { SizeChartModal } from "./SizeChartModal";
import type { ResolvedSizeChart } from "@/src/types/product/products";

// Link "Tabela de medidas" que abre o modal. Não renderiza nada quando o produto
// não tem tabela resolvida (rows vazio).
export function SizeChartTrigger({ chart }: { chart?: ResolvedSizeChart }) {
    const [open, setOpen] = useState(false);

    if (!chart || !chart.rows || chart.rows.length === 0) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8C2F39] underline underline-offset-4 transition-opacity hover:opacity-80"
            >
                <Ruler size={16} />
                Tabela de medidas
            </button>
            {open && <SizeChartModal chart={chart} onClose={() => setOpen(false)} />}
        </>
    );
}
