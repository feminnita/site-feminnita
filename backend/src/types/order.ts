export type CreateOrderInput = {
    customerId: string;
    items: {
        productId: string;
        size: string;
        color?: string;
        quantity: number;
    }[];
    paymentMethod: 'pix' | 'boleto' | 'card';
    installments?: number;
    creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
    };
    remoteIp?: string;
    couponCode?: string;
    shippingAddress: Record<string, unknown>;
    shippingServiceId?: number;
    // Retirada na fábrica: quando true, ignora transportadora/etiqueta e zera o frete.
    pickup?: boolean;
};