"use client";

import { getResaleTerm, type ResaleTerm } from "@/src/services/resaleTermService";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TermoDeRevendaPage() {
    const [term, setTerm] = useState<ResaleTerm | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getResaleTerm()
            .then(setTerm)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#FAF6F2] px-4 py-12">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                    <Link href="/">
                        <h1 className="text-3xl font-bold tracking-widest text-[#1A1A1A]">
                            FEMINNITA
                        </h1>
                    </Link>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                        <h2 className="text-2xl font-light text-[#1A1A1A]">
                            Termo de Revenda
                        </h2>
                        {term?.version ? (
                            <span className="text-sm text-gray-400">
                                versão {term.version}
                            </span>
                        ) : null}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="animate-spin text-[#8C2F39]" size={40} />
                        </div>
                    ) : term && term.content.trim() ? (
                        <div
                            className="prose max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: term.content }}
                        />
                    ) : (
                        <p className="py-12 text-center text-gray-500">
                            Termo em revisão. Em breve o conteúdo estará disponível aqui.
                        </p>
                    )}
                </div>

                <p className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
                        ← Voltar para a loja
                    </Link>
                </p>
            </div>
        </div>
    );
}
