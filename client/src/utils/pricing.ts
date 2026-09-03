export const PIX_DISCOUNT_RATE = 0.05;

// Preço efetivo: usa salePrice quando existe, é > 0 e MENOR que o preço cheio.
// salePrice = 0/null => sem promoção (retorna o preço cheio).
export function effectivePrice(
    price: number,
    salePrice: number | null | undefined,
): number {
    if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
    return price;
}

export function hasActiveSale(
    price: number,
    salePrice: number | null | undefined,
): boolean {
    return salePrice != null && salePrice > 0 && salePrice < price;
}

export function pixFromPrice(price: number): number {
    return price * (1 - PIX_DISCOUNT_RATE);
}

// Arredonda para 2 casas (centavos), evitando erro de ponto flutuante.
export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Formata em reais SEMPRE com 2 casas (nem 1, nem 3). Sem isso, o toLocaleString
// padrão pode exibir 3 casas (o famoso "R$ 12,035").
export function formatBRL(value: number): string {
    return value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// Valor de cada parcela (as n-1 primeiras) com 2 casas exatas.
export function installmentValue(total: number, installments: number): number {
    if (installments <= 1) return round2(total);
    return round2(total / installments);
}

// A ÚLTIMA parcela absorve o resto do arredondamento, de modo que a soma de
// todas as parcelas seja EXATAMENTE o total. Ex.: total 24,07 em 2x =>
// 12,04 + 12,03 = 24,07 (e não 12,035 + 12,035).
export function lastInstallmentValue(total: number, installments: number): number {
    if (installments <= 1) return round2(total);
    const first = installmentValue(total, installments);
    return round2(total - first * (installments - 1));
}