import { apiGet, apiPost } from "./api";
import { origemDaVisita } from "../lib/origemDaVisita";
import { afiliadaDaVisita } from "../lib/afiliada";
import { parseCardExpiry } from "../utils/checkout";
import type { CartItem } from "../types/cart/cart";
import { ApiOrderResponse, type CardInput, type OrderPaymentResult, type ShippingAddress } from "../types/checkout/checkout";


export async function createOrder(input: {
    // Quem esta comprando, quando NAO ha sessao. O servidor usa a sessao
    // sempre que ela existe e ignora este campo — ninguem compra em nome
    // de outra pessoa mandando um e-mail no corpo da requisicao.
    convidado?: { name: string; email: string; phone?: string; cpf?: string };
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
        convidado: input.convidado,
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
        // De onde veio a visita que virou este pedido — e o que permite dizer
        // depois qual campanha e qual arte geraram venda de verdade.
        origem: origemDaVisita(),
        // Codigo da afiliada que trouxe esta visita, quando houver. O servidor
        // confere se existe e se esta aprovada — aqui e so o que o navegador viu.
        afiliada: afiliadaDaVisita(),
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
    /**
     * Quem compra sem conta se identifica pelo e-mail. É por ele que o servidor
     * sabe se ela já comprou — e portanto se o cupom de primeira compra vale.
     * Sem isso, a tela mostraria um desconto que o pedido recusaria depois.
     */
    email?: string,
): Promise<{ code: string; discount: number }> {
    const data = (await apiPost<{ code: string; discount: number }>(
        "/api/store/orders/coupon/preview",
        { code, subtotal, email },
    )) as { code: string; discount: number };

    return data;
}

// Cupom que a loja aplica sozinha (primeira compra). Responde null quando nao
// ha nenhum — e isso e normal, nao erro.
export async function fetchAutomaticCoupon(
    subtotal: number,
    email?: string,
): Promise<{ code: string; discount: number } | null> {
    try {
        const comEmail = email ? `&email=${encodeURIComponent(email)}` : "";
        return await apiGet<{ code: string; discount: number } | null>(
            `/api/store/orders/coupon/automatico?subtotal=${subtotal}${comEmail}`,
        );
    } catch {
        return null;
    }
}

export type InfoDePagamento = {
    paymentMethod: "pix" | "boleto" | "card" | null;
    total: string;
    status: string;
    invoiceUrl: string | null;
    bankSlipUrl: string | null;
    pixQrCode: string | null;
    pixCopyPaste: string | null;
};

// Pagamento pendente de um pedido, para a cliente retomar depois. Buscado no
// Asaas a cada abertura, e nao guardado: boleto vence e cobranca trocada e
// cancelada. Responde null quando nao ha nada a pagar — e isso e normal.
export async function fetchPaymentInfo(orderId: string): Promise<InfoDePagamento | null> {
    try {
        return await apiGet<InfoDePagamento | null>(`/api/store/orders/${orderId}/pagamento`);
    } catch {
        return null;
    }
}

// Troca a forma de pagamento de um pedido ja criado. O servidor recalcula o
// total (o PIX tem 5%), cancela a cobranca antiga e emite outra.
export async function changePaymentMethod(
    orderId: string,
    paymentMethod: "pix" | "boleto" | "card",
    installments = 1,
): Promise<OrderPaymentResult> {
    const data = (await apiPost<{
        paymentMethod: "pix" | "boleto" | "card";
        total: string;
        payment: {
            invoiceUrl: string | null;
            bankSlipUrl: string | null;
            pixQrCode: string | null;
            pixCopyPaste: string | null;
        };
    }>(`/api/store/orders/${orderId}/pagamento`, { paymentMethod, installments })) as {
        paymentMethod: "pix" | "boleto" | "card";
        total: string;
        payment: {
            invoiceUrl: string | null;
            bankSlipUrl: string | null;
            pixQrCode: string | null;
            pixCopyPaste: string | null;
        };
    };

    return {
        orderId,
        orderNumber: "",
        total: Number(data.total),
        method: data.paymentMethod,
        invoiceUrl: data.payment.invoiceUrl,
        bankSlipUrl: data.payment.bankSlipUrl,
        pixQrCode: data.payment.pixQrCode,
        pixCopyPaste: data.payment.pixCopyPaste,
    };
}

const ERROR_MESSAGES: [string, string][] = [
    // Compra sem conta. Sem estas duas, faltar o e-mail virava "Erro ao
    // processar o pedido" — a cliente reenviava, dava o mesmo, e desistia
    // sem nunca saber que era um campo vazio.
    ["GUEST_DATA_REQUIRED", "Preencha seu nome e e-mail para continuar."],
    ["GUEST_EMAIL_INVALID", "Confira o e-mail digitado."],
    ["MIN_ORDER_NOT_REACHED", "O pedido mínimo é de R$ 199,00. Adicione mais peças para finalizar."],
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
