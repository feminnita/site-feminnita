"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ResolvedSizeChart } from "@/src/types/product/products";

type Props = {
    chart: ResolvedSizeChart;
    onClose: () => void;
};

// Desenho "como medir": silhueta simples + linhas tracejadas nas medidas do tipo.
// As colunas do chart nomeiam as linhas (best-effort: até 3 primeiras posições).
function HowToMeasure({ columns }: { columns: string[] }) {
    const labels = columns.slice(0, 3);
    // Posições verticais das linhas de medida ao longo do corpo.
    const ys = [70, 120, 175];

    return (
        <svg
            viewBox="0 0 220 260"
            className="mx-auto h-56 w-auto"
            role="img"
            aria-label="Como medir"
        >
            {/* Silhueta simples de tronco/vestido */}
            <path
                d="M110 18
                   c-14 0 -24 8 -24 20
                   c0 8 -22 12 -30 26
                   c-3 5 2 9 7 7
                   c10 -4 17 -8 22 -12
                   c-4 30 -10 90 -12 150
                   c-1 14 12 18 37 18
                   s38 -4 37 -18
                   c-2 -60 -8 -120 -12 -150
                   c5 4 12 8 22 12
                   c5 2 10 -2 7 -7
                   c-8 -14 -30 -18 -30 -26
                   c0 -12 -10 -20 -24 -20 z"
                fill="#F6E9EA"
                stroke="#8C2F39"
                strokeWidth="2"
            />
            {labels.map((label, i) => (
                <g key={label}>
                    <line
                        x1="34"
                        y1={ys[i]}
                        x2="186"
                        y2={ys[i]}
                        stroke="#8C2F39"
                        strokeWidth="1.5"
                        strokeDasharray="5 4"
                    />
                    <text
                        x="110"
                        y={ys[i] - 6}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="#8C2F39"
                    >
                        {label}
                    </text>
                </g>
            ))}
        </svg>
    );
}

export function SizeChartModal({ chart, onClose }: Props) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const hasEquiv = chart.rows.some((r) => r.equiv && r.equiv.trim() !== "");

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Tabela de medidas"
        >
            <div
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {chart.name || "Tabela de medidas"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="mb-2 text-center text-sm text-gray-500">Como medir</p>
                {chart.howToMeasureImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={chart.howToMeasureImage}
                        alt="Como medir"
                        className="mx-auto h-auto w-full max-w-xs rounded-lg object-contain"
                    />
                ) : (
                    <HowToMeasure columns={chart.columns} />
                )}

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b-2 border-[#8C2F39] text-left">
                                <th className="px-2 py-2 font-semibold text-gray-900">Tamanho</th>
                                {hasEquiv && (
                                    <th className="px-2 py-2 font-semibold text-gray-900">Equiv.</th>
                                )}
                                {chart.columns.map((col) => (
                                    <th key={col} className="px-2 py-2 font-semibold text-gray-900">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {chart.rows.map((row, ri) => (
                                <tr key={`${row.label}-${ri}`} className="border-b border-gray-100">
                                    <td className="px-2 py-2 font-medium text-gray-900">{row.label}</td>
                                    {hasEquiv && (
                                        <td className="px-2 py-2 text-gray-600">{row.equiv ?? ""}</td>
                                    )}
                                    {chart.columns.map((_, ci) => (
                                        <td key={ci} className="px-2 py-2 text-gray-600">
                                            {row.values[ci] ?? ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {chart.footer && (
                    <p className="mt-4 text-xs text-gray-500">{chart.footer}</p>
                )}
            </div>
        </div>
    );
}
