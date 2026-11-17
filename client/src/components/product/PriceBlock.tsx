import { effectivePrice, hasActiveSale, pixFromPrice } from "../../utils/pricing";
import type { PriceBlockProps } from "../../types/product/products";
import { MIN_ORDER, formatBRL } from "../../lib/minOrder";

export function PriceBlock({
    price,
    salePrice,
    saleStart,
    saleEnd,
    installments,
    installmentPrice,
}: PriceBlockProps) {
    const effective = effectivePrice(price, salePrice, saleStart, saleEnd);
    const onSale = hasActiveSale(price, salePrice, saleStart, saleEnd);
    const installmentValue = onSale ? effective / installments : installmentPrice;

    return (
        <div className="border-b border-t py-4">
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
