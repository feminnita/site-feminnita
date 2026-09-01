import { effectivePrice, hasActiveSale, pixFromPrice } from "../../utils/pricing";
import type { PriceBlockProps } from "../../types/product/products";

export function PriceBlock({
    price,
    salePrice,
    installments,
    installmentPrice,
}: PriceBlockProps) {
    const effective = effectivePrice(price, salePrice);
    const onSale = hasActiveSale(price, salePrice);
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
        </div>
    );
}
