"use client";

import { X } from "lucide-react";
import type { PropsMobileFilterSheet } from "../../types/catalog/catalog";

export function MobileFilterSheet({
    open,
    onClose,
    resultCount,
    children,
}: PropsMobileFilterSheet) {
    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
                onClick={onClose}
            />
            <div className="fixed bottom-0 left-0 right-0 z-[70] flex max-h-[85vh] flex-col rounded-t-2xl bg-white lg:hidden">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h3 className="font-semibold">Filtros</h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
                <div className="border-t px-5 pb-6 pt-3">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-[#8C2F39] py-3 font-medium text-white transition-colors hover:bg-[#7a2832]"
                    >
                        Ver {resultCount} produto{resultCount !== 1 ? "s" : ""}
                    </button>
                </div>
            </div>
        </>
    );
}
