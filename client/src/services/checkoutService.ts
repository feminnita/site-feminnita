import { apiPost } from "./api";
import { parseCardExpiry } from "../utils/checkout";
import type { CartItem } from "../types/cart/cart";
import { ApiOrderResponse, type CardInput, type OrderPaymentResult, type ShippingAddress } from "../types/checkout/checkout";


export async function createOrder(input: {
    items: CartItem[];
    paymentMethod: "pix" | "boleto" | "card";
    installments: number;
    card?: CardInput;
    couponCode?: string;
    shippingServiceId: number;
    pickup?: boolean;
    shippingAddress: ShippingAddress;
}): Promise<OrderPaymentResult> {

    const payload = {
        items: input.items.map((item) => ({
            productId: item.id,
            size: item.selectedSize,
            color: item.selectedColor || undefined,
            quantity: item.quantity,
        })),
        paymentMethod: input.paymentMethod,
        installments: input.installments,
        couponCode: input.couponCode || undefined,
        shippingServiceId: input.shippingServiceId,
        pickup: input.pickup || undefined,
        shippingAddress: input.shippingAddress,
        creditCard: input.paymentMethod === "card" && input.card ? {
            holderName: input.card.name,
            number: input.card.number.replace(/\s/g, ""),
            expiryMonth: parseCardExpiry(input.card.expiry).month,
            expiryYear: parseCardExpiry(input.card.expiry).year,
            ccv: input.card.cvv,
        } : undefined,
    };

    const data = (await apiPost<ApiOrderResponse>(
        "/api/store/orders",
        payload,
    )) as ApiOrderResponse;

    return {
        orderId: data.order.id,
        orderNumber: data.order.orderNumber,
        total: Number(data.order.total) || 0,
        method: input.paymentMethod,
        invoiceUrl: data.payment.invoiceUrl ?? null,
        bankSlipUrl: data.payment.bankSlipUrl ?? null,
        pixQrCode: data.payment.pixQrCode ?? null,
        pixCopyPaste: data.payment.pixCopyPaste ?? null,
    };
}

export async function previewCoupon(
    code: string,
    subtotal: number,
): Promise<{ code: string; discount: number }> {
    const data = (await apiPost<{ code: string; discount: number }>(
        "/api/store/orders/coupon/preview",
        { code, subtotal },
    )) as { code: string; discount: number };

    return data;
}

const ERROR_MESSAGES: [string, string][] = [
    ["EMPTY_CART", "Seu carrinho está vazio."],
    ["PRODUCT_UNAVAILABLE", "Um dos produtos não está mais disponível."],
    ["SKU_NOT_FOUND", "Uma das variações escolhidas não está mais disponível."],
    ["OUT_OF_STOCK", "Um dos produtos ficou sem estoque. Revise o carrinho."],
    ["COUPON_NOT_FOUND", "Cupom não encontrado. Confira o código."],
    ["COUPON_ALREADY_USED", "Você já usou este cupom em outro pedido."],
    ["COUPON_EXHAUSTED", "Este cupom esgotou."],
    ["COUPON_MAX_USES_REACHED", "Este cupom esgotou."],
    ["COUPON_INACTIVE", "Este cupom não está mais ativo."],
    ["COUPON_EXPIRED", "Este cupom expirou."],
    ["COUPON_MIN_ORDER", "O pedido não atinge o valor mínimo deste cupom."],
    ["CPF_REQUIRED", "Informe um CPF válido para continuar."],
    ["SHIPPING_CEP_REQUIRED", "Informe o CEP de entrega."],
    [
        "SHIPPING_OPTION_UNAVAILABLE",
        "A opção de frete escolhida não está mais disponível. Recalcule o frete.",
    ],
    [
        "PAYMENT_CREATION_FAILED",
        "Não conseguimos gerar o pagamento agora. Tente de novo em instantes.",
    ],
];

export function mapOrderError(rawMessage: string): string {
    const found = ERROR_MESSAGES.find(([code]) => rawMessage.includes(code));
    return found ? found[1] : "Erro ao processar o pedido. Tente novamente.";
}

export function mapCouponError(rawMessage: string): string {
    const found = ERROR_MESSAGES.find(([code]) => rawMessage.includes(code));
    return found ? found[1] : "Não foi possível validar o cupom. Tente novamente.";
}
