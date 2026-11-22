"use client";

import { useEffect, useState } from "react";

// Contagem regressiva da promoção especial (22/11, Chris). Só aparece quando a
// promoção tem data de fim. Antes de montar no navegador não mostra nada (evita
// diferença entre o HTML do servidor e o do navegador); ao zerar, some.
export function ContagemRegressiva({ fim }: { fim: string }) {
    const alvo = new Date(fim).getTime();
    const [agora, setAgora] = useState<number | null>(null);

    useEffect(() => {
        setAgora(Date.now());
        const t = setInterval(() => setAgora(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    if (agora === null || Number.isNaN(alvo)) return null;
    const resta = Math.max(0, Math.floor((alvo - agora) / 1000));
    if (resta <= 0) return null;

    const dias = Math.floor(resta / 86400);
    const horas = Math.floor((resta % 86400) / 3600);
    const min = Math.floor((resta % 3600) / 60);
    const seg = resta % 60;
    const dd = (n: number) => String(n).padStart(2, "0");

    const Caixa = ({ n, rotulo }: { n: string; rotulo: string }) => (
        <span className="flex min-w-[46px] flex-col items-center rounded-md bg-[#111] px-2 py-1 text-white">
            <span className="text-xl font-extrabold tabular-nums leading-none">{n}</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-gray-300">{rotulo}</span>
        </span>
    );

    return (
        <div className="mb-3 flex flex-wrap items-center gap-2" aria-live="off">
            <span className="text-sm font-bold uppercase tracking-wide text-[#d92d20]">⏰ Termina em</span>
            <div className="flex items-center gap-1">
                {dias > 0 && <Caixa n={String(dias)} rotulo={dias === 1 ? "dia" : "dias"} />}
                <Caixa n={dd(horas)} rotulo="horas" />
                <Caixa n={dd(min)} rotulo="min" />
                <Caixa n={dd(seg)} rotulo="seg" />
            </div>
        </div>
    );
}
