"use client";

import { useState, useLayoutEffect, useRef } from "react";
import type { ProductDescriptionProps } from "../../types/product/products";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDescriptionHtml } from "../../utils/product";
import styles from "./ProductDescription.module.css";

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
        <div className="border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-900">
                Descrição
            </h2>
            <div>
                {description ? (
                    <div
                        ref={contentRef}
                        className={`${styles.richText} overflow-hidden transition-[max-height] duration-500 ease-in-out`}
                        style={{ maxHeight: expanded ? fullHeight : COLLAPSED_HEIGHT }}
                        dangerouslySetInnerHTML={{
                            __html: formatDescriptionHtml(description),
                        }}
                    />
                ) : (
                    <p className={styles.richText}>
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
