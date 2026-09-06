"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ResolvedSizeChart } from "@/src/types/product/products";
import { sortSizes } from "@/src/utils/sizes";

type Props = {
    chart: ResolvedSizeChart;
    // Tamanho que a cliente já escolheu na página — destaca a coluna dele.
    selectedSize?: string;
    onClose: () => void;
};

const norm = (s: string) => (s || "").trim().toLowerCase();

// Converte cm → polegada nos números do texto, preservando ranges ("88-92") e
// qualquer texto não-numérico. Só quando a unidade é "pol".
function toUnit(v: string | number | null | undefined, unit: "cm" | "pol"): string {
    const str = v == null ? "" : String(v);
    if (unit === "cm" || !str) return str;
    return str.replace(/\d+([.,]\d+)?/g, (n) => {
        const num = parseFloat(n.replace(",", "."));
        return Number.isNaN(num) ? n : (num / 2.54).toFixed(1).replace(".", ",");
    });
}

// Formato useange: tamanhos como COLUNAS, medidas como LINHAS; a coluna do
// tamanho escolhido fica destacada. Desktop = imagem à esquerda + tabela à
// direita; mobile = imagem em cima, tabela embaixo rolando só ela na horizontal.
export function SizeChartModal({ chart, selectedSize, onClose }: Props) {
    const [unit, setUnit] = useState<"cm" | "pol">("cm");

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    // As linhas vêm do banco na ordem em que foram semeadas, que nem sempre é a
    // ordem de tamanho — a tabela feminina aparecia como "G · M · GG". Ordena
    // pela mesma régua usada no seletor de tamanho da página.
    const ordered = (() => {
        const ordem = sortSizes(chart.rows.map((r) => r.label));
        return [...chart.rows].sort(
            (a, b) => ordem.indexOf(a.label) - ordem.indexOf(b.label),
        );
    })();

    const sizes = ordered.map((r) => r.label); // colunas
    const measures = chart.columns; // linhas
    const hasEquiv = ordered.some((r) => r.equiv && r.equiv.trim() !== "");
    const hasImage = !!chart.howToMeasureImage;
    const selIdx = selectedSize
        ? sizes.findIndex((s) => norm(s) === norm(selectedSize))
        : -1;

    const colClass = (i: number) =>
        i === selIdx ? "bg-[#F3EEE9] font-semibold text-[#8C2F39]" : "";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Tabela de Medidas"
        >
            <div
                className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho: título à esquerda; cm|pol e X à direita */}
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Tabela de Medidas
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex overflow-hidden rounded-full border border-gray-200 text-xs">
                            {(["cm", "pol"] as const).map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => setUnit(u)}
                                    aria-pressed={unit === u}
                                    className={`px-3 py-1 font-medium transition-colors ${
                                        unit === u
                                            ? "bg-[#8C2F39] text-white"
                                            : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Fechar"
                            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Corpo: desktop 2 colunas (imagem | tabela); mobile empilha */}
                <div className="flex flex-col gap-6 overflow-y-auto p-6 md:flex-row">
                    {hasImage && (
                        <div className="shrink-0 md:w-2/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={chart.howToMeasureImage}
                                alt="Como medir"
                                className="mx-auto h-auto w-full max-w-xs rounded-lg object-contain md:max-w-none"
                            />
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        {/* rola só a tabela na horizontal — nunca empurra a página */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[15px] leading-relaxed">
                                <thead>
                                    <tr className="border-b-2 border-[#8C2F39]">
                                        <th className="px-3 py-2 text-left font-semibold text-gray-900">
                                            Medida
                                        </th>
                                        {sizes.map((size, i) => (
                                            <th
                                                key={`${size}-${i}`}
                                                className={`whitespace-nowrap px-3 py-2 text-center font-semibold text-gray-900 ${colClass(i)}`}
                                            >
                                                {size}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {hasEquiv && (
                                        <tr className="border-b border-gray-100">
                                            <td className="px-3 py-2 font-medium text-gray-700">
                                                Equivalente
                                            </td>
                                            {ordered.map((r, i) => (
                                                <td
                                                    key={i}
                                                    className={`whitespace-nowrap px-3 py-2 text-center text-gray-700 ${colClass(i)}`}
                                                >
                                                    {r.equiv ?? ""}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                    {measures.map((measure, ci) => (
                                        <tr
                                            key={`${measure}-${ci}`}
                                            className="border-b border-gray-100"
                                        >
                                            <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                                                {measure}
                                            </td>
                                            {ordered.map((r, ri) => (
                                                <td
                                                    key={ri}
                                                    className={`whitespace-nowrap px-3 py-2 text-center text-gray-700 ${colClass(ri)}`}
                                                >
                                                    {toUnit(r.values[ci], unit)}
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
            </div>
        </div>
    );
}
