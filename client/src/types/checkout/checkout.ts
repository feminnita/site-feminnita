export type ShippingOption = {
    id: number;
    name: string;
    company: string;
    price: number;
    deliveryDays: number;
    // Retirada na fábrica: opção sem transportadora, custo R$ 0,00.
    pickup?: boolean;
    address?: string;
    hours?: string;
    note?: string;
}

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