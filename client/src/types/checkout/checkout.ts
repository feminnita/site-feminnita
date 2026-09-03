export type ShippingOption = {
    id: number;
    name: string;
    company: string;
    price: number;
    deliveryDays: number;
}

// Retirada na fábrica: opção SINTÉTICA de frete (não vem do Melhor Envio).
// Sempre disponível, para qualquer CEP e mesmo se a cotação ME falhar. Frete
// R$ 0,00. O id negativo nunca colide com um serviço de transportadora do ME.
// O backend reconhece esse id, não cota o ME e grava shippingMethod com "retir".
export const PICKUP_SHIPPING_ID = -1;

export const PICKUP_ADDRESS =
    "FNT Confecções — Rua Marechal Rondon, 669-A, Cônego, Nova Friburgo/RJ · seg a sex, 8h–17h";

export const PICKUP_OPTION: ShippingOption = {
    id: PICKUP_SHIPPING_ID,
    name: "Retirar na fábrica",
    company: "",
    price: 0,
    deliveryDays: 0,
};

// Frete sob consulta: opção SINTÉTICA que o backend devolve quando o pedido é
// volumoso demais (3+ volumes) para cotar no Melhor Envio. Chega na lista de
// opções como qualquer outra (id -2, preço 0). A compra segue normalmente e o
// pedido nasce marcado "a combinar" — a operação cota a coleta depois.
export const SOB_CONSULTA_SHIPPING_ID = -2;

export const SOB_CONSULTA_SUBTITLE =
    "Pedido volumoso — entraremos em contato para combinar o envio";

export type ShippingAddress = {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
};

export type CardInput = {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
}

export type OrderPaymentResult = {
    orderId: string;
    orderNumber: string;
    total: number;
    method: "pix" | "boleto" | "card";
    invoiceUrl: string | null;
    bankSlipUrl: string | null;
    pixQrCode: string | null;
    pixCopyPaste: string | null;
};

export type ApiOrderResponse = {
    order: Record<string, any>;
    payment: {
        asaasPaymentId: string;
        invoiceUrl: string | null;
        bankSlipUrl: string | null;
        pixQrCode: string | null;
        pixCopyPaste: string | null;
    };
};