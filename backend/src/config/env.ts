import 'dotenv/config';

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
    }
    return value;
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3333),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],

    databaseUrl: required('DATABASE_URL'),
    clientUrl: required('CLIENT_URL'),
    // URL pública do próprio backend (links de confirmar/descadastrar apontam pra cá)
    apiUrl: process.env.API_URL ?? 'http://localhost:3333',

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3333/api/store/auth/google/callback',
    },

    asaas: {
        baseUrl: required('ASAAS_BASE_URL'),
        apiKey: required('ASAAS_API_KEY'),
        webhookToken: required('ASAAS_WEBHOOK_TOKEN'),
    },

    resend: {
        apiKey: required('RESEND_API_KEY'),
        mailFrom: required('MAIL_FROM'),
    },

    melhorEnvio: {
        baseUrl: required('ME_BASE_URL'),
        token: required('ME_TOKEN'),
    },

    // e-mail marketing / carrinho abandonado — DESABILITADO por padrão (não envia sem opt-in explícito)
    abandonedCart: {
        enabled: process.env.ABANDONED_CART_ENABLED === 'true',
    },

    store: {
        cep: required('STORE_CEP'),
        name: required('FEMINNITA_NAME'),
        email: required('FEMINNITA_EMAIL'),
        phone: required('FEMINNITA_PHONE'),
        document: required('FEMINNITA_DOCUMENT'),
        address: required('FEMINNITA_ADDRESS'),
        number: required('FEMINNITA_NUMBER'),
        district: required('FEMINNITA_DISTRICT'),
        city: required('FEMINNITA_CITY'),
        state: required('FEMINNITA_STATE'),
    },
};
