import { effectivePrice, hasActiveSale, pixFromPrice } from "../../utils/pricing";
import type { PriceBlockProps } from "../../types/product/products";
import { MIN_ORDER, formatBRL } from "../../lib/minOrder";
import { ContagemRegressiva } from "./ContagemRegressiva";
import { Kaushan_Script } from "next/font/google";

const pincel = Kaushan_Script({ subsets: ["latin"], weight: ["400"], display: "swap" });

// "termina domingo, 29/11, às 23:59" — a promoção acaba no instante gravado; mostra o minuto anterior.
function quandoTermina(fim: string | null): string | null {
    if (!fim) return null;
    const d = new Date(new Date(fim).getTime() - 60_000);
    if (Number.isNaN(d.getTime())) return null;
    const dia = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    return `termina ${dia}, às ${hora}`;
}

// "Preço de lançamento" tem arte própria (22/11, Chris escolheu a opção B):
// % OFF dourado no preto + "Preço de lançamento" em pincel no dourado.
function Brilho({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
            <path d="M20 0 C22 13 27 18 40 20 C27 22 22 27 20 40 C18 27 13 22 0 20 C13 18 18 13 20 0 Z" fill="#fff6cc" />
        </svg>
    );
}

function TagLancamento({ termina, pct, compacta }: { termina: string | null; pct: number; compacta: boolean }) {
    return (
        <div className={`inline-flex items-stretch overflow-hidden rounded-lg shadow-lg ${compacta ? "" : "mb-3"}`}>
            {pct > 0 && (
                <span className={`flex items-center bg-[#111] font-black text-[#f5b301] ${compacta ? "px-2 text-base" : "px-4 text-3xl"}`}>
                    {pct}%<span className={`ml-1 font-extrabold text-white ${compacta ? "text-[9px]" : "text-sm"}`}>OFF</span>
                </span>
            )}
            <span className={`relative flex flex-col justify-center bg-gradient-to-br from-[#ffe082] via-[#f5b301] to-[#d98c00] text-[#111] ${compacta ? "px-2 py-0.5" : "px-4 py-2"}`}>
                <span className={`font-extrabold uppercase ${compacta ? "text-[7px] tracking-[.2em]" : "text-[11px] tracking-[.25em]"}`}>Preço de</span>
                <span className={`${pincel.className} leading-none ${compacta ? "text-[17px]" : "text-3xl"}`}>lançamento</span>
                {termina && <span className="text-[10px] font-medium">{termina}</span>}
                <Brilho className={`absolute ${compacta ? "-right-0.5 -top-0.5 h-3 w-3" : "right-1 top-1 h-5 w-5"}`} />
            </span>
        </div>
    );
}

export function PromoTag({ selo, fim, pct, compacta = false }: { selo: string; fim?: string | null; pct: number; compacta?: boolean }) {
    const termina = compacta ? null : quandoTermina(fim ?? null);
    if (selo.trim().toLowerCase() === "preço de lançamento") return <TagLancamento termina={termina} pct={pct} compacta={compacta} />;
    return (
        <div className={`inline-flex items-stretch overflow-hidden rounded-md shadow-sm ${compacta ? "text-[10px]" : "mb-3 text-sm"}`}>
            {pct > 0 && (
                <span className={`flex items-center bg-[#1f1f1f] font-extrabold text-white ${compacta ? "px-1.5 py-0.5" : "px-3 py-1.5 text-xl"}`}>
                    {pct}% OFF
                </span>
            )}
            <span className={`flex flex-col justify-center bg-[#d92d20] font-bold uppercase leading-tight text-white ${compacta ? "px-1.5 py-0.5" : "px-3 py-1.5"}`}>
                <span>{selo}</span>
                {termina && <span className="text-[11px] font-medium normal-case opacity-90">{termina}</span>}
            </span>
        </div>
    );
}

export function PriceBlock({
    price,
    salePrice,
    saleStart,
    saleEnd,
    installments,
    installmentPrice,
    promo,
}: PriceBlockProps) {
    const effective = effectivePrice(price, salePrice, saleStart, saleEnd);
    const onSale = hasActiveSale(price, salePrice, saleStart, saleEnd);
    const installmentValue = onSale ? effective / installments : installmentPrice;
    const pct = onSale && price > 0 ? Math.round((1 - effective / price) * 100) : 0;

    return (
        <div className="border-b border-t py-4">
            {/* Etiqueta da promoção especial (22/11, Chris: "tipo isso onde fica o preço") */}
            {promo && <PromoTag selo={promo.selo} fim={promo.fim} pct={pct} />}
            {promo?.fim && <ContagemRegressiva fim={promo.fim} />}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-bold sm:text-4xl">
                    R$ {effective.toFixed(2).replace(".", ",")}
                </span>
                {onSale && (
                    <span className="text-lg text-gray-400 line-through">
                        R$ {price.toFixed(2).replace(".", ",")}
                    </span>
                )}
                <span className="text-base font-semibold text-green-600 sm:text-lg">
                    R$ {pixFromPrice(effective).toFixed(2).replace(".", ",")} no
                    PIX
                </span>
            </div>
            <p className="mt-1 text-gray-600">
                ou {installments}x de R$ {installmentValue.toFixed(2).replace(".", ",")}{" "}
                sem juros
            </p>
            {/* O minimo do atacado aparece aqui, junto do preco. Quem chega pelo
                anuncio cai direto nesta pagina e so descobria os R$ 199 no
                checkout: em 16-17/11, 2 das 3 clientes que desistiram no checkout
                tinham R$ 19,99 e R$ 79,96 no carrinho. */}
            <p className="mt-2 text-sm text-gray-600">
                Venda no atacado: pedido mínimo de{" "}
                <strong className="text-[#000000]">{formatBRL(MIN_ORDER)}</strong>, somando
                todas as peças do carrinho.
            </p>
        </div>
    );
}
