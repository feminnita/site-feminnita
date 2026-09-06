"use client";

import { Star } from "lucide-react";
import type { Review } from "../../types/product/products";

type Props = {
    reviews?: Review[];
};

function Stars({ value, size = 16 }: { value: number; size?: number }) {
    // 5 estrelas; preenche as inteiras até `value` (arredondado). Simples e legível.
    const filled = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    size={size}
                    className={
                        i < filled
                            ? "fill-[#E4A11B] text-[#E4A11B]"
                            : "fill-gray-200 text-gray-200"
                    }
                />
            ))}
        </span>
    );
}

// Bloco de avaliações. REGRA: sem nenhuma avaliação, NÃO aparece (return null) —
// nada de estrela vazia. A fonte real dos reviews é decisão pendente da dona;
// hoje o backend devolve [] e o bloco fica pronto e invisível.
export function ProductReviews({ reviews }: Props) {
    if (!reviews || reviews.length === 0) return null;

    const average =
        reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;

    return (
        <section className="border-t border-gray-200 pt-6">
            <h2 className="mb-6 text-2xl font-light">Avaliações</h2>

            <div className="mb-8 flex items-center gap-4">
                <span className="text-4xl font-light text-gray-900">
                    {average.toFixed(1).replace(".", ",")}
                </span>
                <div>
                    <Stars value={average} size={20} />
                    <p className="mt-1 text-sm text-gray-500">
                        {reviews.length}{" "}
                        {reviews.length === 1 ? "avaliação" : "avaliações"}
                    </p>
                </div>
            </div>

            <ul className="space-y-6">
                {reviews.map((r, i) => (
                    <li
                        key={`${r.author}-${r.date}-${i}`}
                        className="border-b border-gray-100 pb-6 last:border-0"
                    >
                        <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-medium text-gray-900">
                                {r.author}
                            </span>
                            <Stars value={r.rating} />
                            <span className="text-sm text-gray-400">{r.date}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700">
                            {r.comment}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
