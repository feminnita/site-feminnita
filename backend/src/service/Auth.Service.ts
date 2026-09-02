import { AppError } from '../errors/AppError';
import * as AuthRepository from '../repository/Auth.Repository';
import * as EmailService from '../integrations/resend/Services';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateSessionToken, hashSessionToken } from '../utils/sessionToken';
import { RESET_TOKEN_TTL_MS, SESSION_TTL_MS } from '../config/auth';
import { env } from '../config/env';

let dummyHashPromise: Promise<string> | null = null;
function getDummyHash() {
    if (!dummyHashPromise) dummyHashPromise = hashPassword('senha-que-nunca-vai-bater');
    return dummyHashPromise;
}

export async function createSessionForCustomer(customerId: string, userAgent?: string) {
    const token = generateSessionToken();
    await AuthRepository.insertSession({
        tokenHash: hashSessionToken(token),
        customerId,
        userAgent: userAgent || 'unknown',
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });

    return token;
}

export async function registerCustomer(input: { name: string; email: string; password: string }) {
    const existing = await AuthRepository.findCustomerByEmail(input.email);
    if (existing) throw new Error('EMAIL_ALREADY_IN_USE');

    const passwordHash = await hashPassword(input.password);
    const customer = await AuthRepository.insertCustomer({ name: input.name, email: input.email, passwordHash });

    await EmailService.sendWelcome({ customerName: customer.name, customerEmail: customer.email });

    return customer;
}

// Checkout sem login: encontra o cliente pelo e-mail ou cria um em silêncio a
// partir dos dados do checkout. Retorna um sessionToken APENAS quando é seguro
// logar automaticamente (conta nova ou conta sem senha) — nunca cria sessão
// para uma conta protegida por senha só com base no e-mail (evita sequestro de
// conta). O pedido é sempre vinculado ao cliente correto de qualquer forma.
export async function findOrCreateGuestCustomer(input: {
    name: string;
    email: string;
    cpf?: string | null;
    phone?: string | null;
    userAgent?: string;
}) {
    const email = input.email.trim().toLowerCase();
    const existing = await AuthRepository.findCustomerByEmail(email);

    if (existing) {
        // Completa contato faltante sem sobrescrever o que já existe.
        await AuthRepository.updateCustomerContact(existing.id, {
            name: existing.name ? null : input.name,
            cpf: existing.cpf ? null : input.cpf,
            phone: existing.phone ? null : input.phone,
        });

        const hasPassword = !!existing.passwordHash || !!existing.googleId;
        const sessionToken = hasPassword
            ? undefined
            : await createSessionForCustomer(existing.id, input.userAgent);

        return { customer: existing, sessionToken, isNew: false };
    }

    const customer = await AuthRepository.insertGuestCustomer({
        name: input.name,
        email,
        cpf: input.cpf ?? null,
        phone: input.phone ?? null,
    });

    const sessionToken = await createSessionForCustomer(customer.id, input.userAgent);
    return { customer, sessionToken, isNew: true };
}

export async function loginCustomer(input: { email: string; password: string; userAgent?: string }) {
    const customer = await AuthRepository.findCustomerByEmail(input.email);
    if (customer && !customer.passwordHash) {
        throw new AppError('Essa conta usa o login com Google', 409);
    }

    const hashToCheck = customer?.passwordHash ?? (await getDummyHash());
    const isValid = await verifyPassword(hashToCheck, input.password);

    if (!customer || !isValid) throw new AppError('Credenciais inválidas', 401);

    const token = await createSessionForCustomer(customer.id, input.userAgent);

    return { customer, token };
}

export async function logoutCustomer(token: string) {
    await AuthRepository.deleteSessionByTokenHash(hashSessionToken(token));
}

export async function forgotPassword(email: string) {
    const customer = await AuthRepository.findCustomerByEmail(email);
    if (!customer) return;

    const token = generateSessionToken();
    await AuthRepository.insertResetToken({
        customerId: customer.id,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    await EmailService.sendPasswordReset({
        customerName: customer.name,
        customerEmail: customer.email,
        resetUrl: `${env.clientUrl}/redefinir-senha?token=${token}`,
    });
}

export async function resetPasswordtoken(token: string, password: string) {
    const row = await AuthRepository.findValidResetToken(hashSessionToken(token));
    if (!row) throw new AppError('Link inválido ou expirado, solicite um novo', 400);

    const passwordHash = await hashPassword(password);
    await AuthRepository.updateCustomerPassword(row.customerId, passwordHash);
    await AuthRepository.markResetTokenUsed(row.id);
    await AuthRepository.deleteSessionsByCustomerId(row.customerId);
}