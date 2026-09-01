//Client
export type AsaasCustomer = {
    id: string;
    name: string;
    email: string;
};

export type AsaasPayment = {
    id: string;
    status: string;
    value: number;
    dueDate: string;
    invoiceUrl: string;
    bankSlipUrl?: string;
}

export type AsaasPixQrCode = {
    encodedImage: string;
    payload: string;
    expirationDate: string;
};


//Service
export type CustomerForCharge = {
    id: string;
    name: string;
    email: string;
    cpf: string;
    phone?: string | null;
    asaasCustomerId?: string | null;
};

export type OrderForCharge = {
    id: string;
    orderNumber: string;
    total: string;
    paymentMethod: string;
    installments?: number;
    creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string
    };
    holderInfo?: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        phone?: string
    };
    remoteIp?: string;
};

