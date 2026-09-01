import { PIX_DISCOUNT_RATE } from "../../utils/pricing";
import type { PriceBlockProps } from "../../types/product/products";

export function PriceBlock({
    price,
    installments,
    installmentPrice,
}: PriceBlockProps) {
    return (
        <div className="border-b border-t py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-bold sm:text-4xl">
                    R$ {price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-base font-semibold text-green-600 sm:text-lg">
                    R$ {(price * (1 - PIX_DISCOUNT_RATE)).toFixed(2).replace(".", ",")} no
                    PIX
                </span>
            </div>
            <p className="mt-1 text-gray-600">
                ou {installments}x de R$ {installmentPrice.toFixed(2).replace(".", ",")}{" "}
                sem juros
            </p>
        </div>
    );
}
