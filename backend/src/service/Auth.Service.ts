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