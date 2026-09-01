"use client";

import { useState, useLayoutEffect, useRef } from "react";
import type { ProductDescriptionProps } from "../../types/product/products";
import { ChevronDown, ChevronUp } from "lucide-react";

const COLLAPSED_HEIGHT = 176;

export function ProductDescription({
    productName,
    description,
}: ProductDescriptionProps) {
    const [expanded, setExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [fullHeight, setFullHeight] = useState(0);

    useLayoutEffect(() => {
        if (contentRef.current) {
            setFullHeight(contentRef.current.scrollHeight);
        }
    }, [description]);

    return (
        <div className="mt-16 max-w-4xl">
            <h2 className="mb-6 text-2xl font-light">Descrição do Produto</h2>
            <div className="prose max-w-none">
                {description ? (
                    <div
                        ref={contentRef}
                        className="duration-600 overflow-hidden whitespace-pre-line text-lg font-medium leading-relaxed text-gray-800 transition-[max-height] ease-in-out"
                        style={{ maxHeight: expanded ? fullHeight : COLLAPSED_HEIGHT }}
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                ) : (
                    <p className="text-lg font-medium leading-relaxed text-gray-800">
                        {productName} — conforto e estilo para o seu dia a dia. Adicione uma
                        descrição completa deste produto no painel administrativo.
                    </p>
                )}
            </div>

            {description && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#8C2F39] hover:underline"
                >
                    {expanded ? "Ver menos" : "Saiba mais"}
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            )}
        </div>
    );
}
