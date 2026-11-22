import { effectivePrice, hasActiveSale, pixFromPrice } from "../../utils/pricing";
import type { PriceBlockProps } from "../../types/product/products";
import { MIN_ORDER, formatBRL } from "../../lib/minOrder";
import { ContagemRegressiva } from "./ContagemRegressiva";
import { EtiquetaPromo } from "./EtiquetaPromo";
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

// Cada etiqueta tem a sua arte (EtiquetaPromo, o mesmo arquivo da prévia do painel).
export function PromoTag({ selo, fim, pct, compacta = false }: { selo: string; fim?: string | null; pct: number; compacta?: boolean }) {
    const termina = compacta ? null : quandoTermina(fim ?? null);
    return (
        <div className={compacta ? "" : "mb-3"}>
            <EtiquetaPromo selo={selo} pct={pct} termina={termina} compacta={compacta} pincel={pincel.className} />
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
