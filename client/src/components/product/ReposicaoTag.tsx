import { Kaushan_Script } from "next/font/google";

// Etiqueta "Chegou reposição" (22/11, Chris). A dona liga no painel, ao lado da
// cor que chegou, e ela vale 7 dias. Visual copiado da arte dela: "Chegou" em
// letra limpa, "reposição" em pincel grosso, corações rosa brilhantes nos cantos.
// Primeira versão (letra fina, coração de texto) ela achou "insossa".
const pincel = Kaushan_Script({ subsets: ["latin"], weight: ["400"], display: "swap" });

function Coracao({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 58" className={className} aria-hidden="true">
            <defs>
                <linearGradient id="repo-coracao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff8fa3" />
                    <stop offset="1" stopColor="#f0435e" />
                </linearGradient>
            </defs>
            <path d="M32 56 C10 40 2 28 2 17 C2 8 9 2 17 2 C24 2 29 6 32 11 C35 6 40 2 47 2 C55 2 62 8 62 17 C62 28 54 40 32 56 Z" fill="url(#repo-coracao)" />
            <path d="M12 12 C14 8 19 7 22 9" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".85" />
            <circle cx="11" cy="18" r="2.4" fill="#fff" opacity=".85" />
        </svg>
    );
}

export function ReposicaoTag({ cores, compacta = false }: { cores?: string[]; compacta?: boolean }) {
    if (compacta) {
        return (
            <span className="relative inline-flex items-baseline gap-1 rounded-lg border border-pink-200 bg-white px-3 pb-1 pt-1.5 text-[#111] shadow-sm">
                <Coracao className="absolute -left-2.5 -top-2.5 h-5 w-5 -rotate-12 drop-shadow" />
                <span className="text-[14px] font-medium">Chegou</span>
                <span className={`${pincel.className} text-[24px] leading-none`}>reposição</span>
                <Coracao className="absolute -bottom-2 -right-2.5 h-[18px] w-[18px] rotate-12 drop-shadow" />
            </span>
        );
    }
    return (
        <div className="relative inline-block rounded-2xl border border-pink-200 bg-white px-8 pb-3 pt-2 text-[#111] shadow-md">
            <Coracao className="absolute -left-3 -top-3 h-9 w-9 -rotate-12 drop-shadow-md" />
            <span className="block text-center text-3xl font-normal tracking-tight">Chegou</span>
            <span className={`${pincel.className} -mt-1 block text-center text-6xl leading-tight`}>reposição</span>
            {cores && cores.length > 0 && (
                <span className="mt-1 block text-center text-xs font-semibold uppercase tracking-wide text-pink-600">{cores.join(" · ")}</span>
            )}
            <Coracao className="absolute -bottom-3 -right-3 h-8 w-8 rotate-12 drop-shadow-md" />
        </div>
    );
}
