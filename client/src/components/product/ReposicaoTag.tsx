import { Dancing_Script } from "next/font/google";

// Etiqueta "Chegou reposição" (22/11, Chris). A dona liga no painel, ao lado da
// cor que chegou, e ela vale 7 dias. Estilo da referência dela: "Chegou" em letra
// simples, "reposição" em letra de mão, corações rosa.
const manuscrita = Dancing_Script({ subsets: ["latin"], weight: ["700"], display: "swap" });

export function ReposicaoTag({ cores, compacta = false }: { cores?: string[]; compacta?: boolean }) {
    if (compacta) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 leading-none text-[#1f1f1f]">
                <span className="text-[10px] text-pink-500">♥</span>
                <span className="text-[11px]">Chegou</span>
                <span className={`${manuscrita.className} text-[15px]`}>reposição</span>
            </span>
        );
    }
    return (
        <div className="relative inline-block rounded-xl bg-pink-50 px-5 pb-2 pt-1.5 text-[#1f1f1f]">
            <span className="absolute -left-1.5 -top-1.5 rotate-[-15deg] text-lg text-pink-500">♥</span>
            <span className="absolute -bottom-1.5 -right-1.5 rotate-[15deg] text-base text-pink-500">♥</span>
            <span className="block text-center text-sm">Chegou</span>
            <span className={`${manuscrita.className} block text-center text-3xl leading-none`}>reposição</span>
            {cores && cores.length > 0 && (
                <span className="mt-1 block text-center text-[11px] text-gray-600">{cores.join(" · ")}</span>
            )}
        </div>
    );
}
