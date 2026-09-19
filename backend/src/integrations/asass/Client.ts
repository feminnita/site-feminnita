import { env } from '../../config/env';
import { AsaasCustomer, AsaasPayment, AsaasPixQrCode } from './types';

async function request<T>(path: string, options: {
    method?: string;
    body?: unknown
} = {}): Promise<T> {

    let response: Response;
    try {
        response = await fetch(`${process.env.ASAAS_BASE_URL}${path}`, {
            method: options.method ?? 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'feminnita-api',
                access_token: process.env.ASAAS_API_KEY!,
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            // Sem timeout, uma chamada lenta/pendurada ao Asaas trava o checkout
            // indefinidamente (o front fica "Processando..." pra sempre). Com o
            // timeout, a request lança -> o try/catch do Order.Service devolve
            // PAYMENT_CREATION_FAILED e a tela mostra mensagem.
            signal: AbortSignal.timeout(20000),
        });
    } catch (err) {
        const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        throw new Error(`ASAAS_UNREACHABLE ${options.method ?? 'GET'} ${path} (${detail})`);
    }

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`ASASS_ERROR ${response.status}: ${detail}`);
    }

    return response.json() as Promise<T>;
}


export function createCustomer(input: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string
}) {
    return request<AsaasCustomer>('/customers', {
        method: 'POST',
        body: input
    });
}

export function createPayment(input: {
    customer: string;
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
    value: number;
    dueDate: string;
    externalReference: string;
    description?: string;
    installmentCount?: number;
    totalValue?: number;
    creditCard?: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string };
    creditCardHolderInfo?: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        phone?: string;
    };
    remoteIp?: string;
}) {
    return request<AsaasPayment>('/payments', {
        method: 'POST',
        body: input
    });
}

// Cancela uma cobranca ainda nao paga. Usado quando a cliente troca a forma de
// pagamento: o valor muda (o PIX tem 5%), entao a cobranca antiga nao serve
// mais e nao pode ficar viva — duas cobrancas abertas do mesmo pedido e o
// caminho para a cliente pagar duas vezes.
export function cancelPayment(paymentId: string) {
    return request<{ id: string; deleted: boolean }>(`/payments/${paymentId}`, {
        method: 'DELETE',
    });
}

export function getPixQrCode(paymentId: string) {
    return request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}
