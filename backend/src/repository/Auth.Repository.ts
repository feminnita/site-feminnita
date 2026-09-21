import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../config/db';
import { customers, customerSessions, passwordResetTokens } from '../db/schema';

export function findCustomerByEmail(email: string) {
    return db.query.customers.findFirst({ where: eq(customers.email, email) });
}

export function findCustomerById(id: string) {
    return db.query.customers.findFirst({
        where: eq(customers.id, id),
        columns: { id: true, name: true, email: true },
    });
}

export async function insertCustomer(values: {
    name: string;
    email: string;
    passwordHash: string;
    cnpj?: string;
    resaleTermVersion?: number;
    resaleTermAcceptedAt?: Date;
    resaleTermAcceptedIp?: string | null;
}) {
    const [customer] = await db.insert(customers).values(values).returning();
    return customer;
}

/**
 * Cliente criada pela COMPRA SEM CONTA: sem senha.
 *
 * A coluna password_hash ja era opcional por causa do login com Google, entao
 * isto nao exige mudanca no banco.
 *
 * Por que criar um registro em vez de gravar nome e e-mail soltos no pedido:
 * tudo que vem depois ja sabe trabalhar com cliente — o e-mail de confirmacao,
 * o aviso de rastreio, o painel, o envio ao Bling, a etiqueta do Melhor Envio,
 * o endereco salvo. Guardar os dados fora dessa tabela obrigaria a remendar
 * cada um desses caminhos.
 *
 * E se um dia ela criar senha com o mesmo e-mail, os pedidos ja estao la.
 */
export async function insertGuestCustomer(values: {
    name: string;
    email: string;
    phone?: string | null;
    cpf?: string | null;
}) {
    const [customer] = await db.insert(customers).values(values).returning();
    return customer;
}

/** Completa dados que faltavam numa cliente ja existente, sem sobrescrever o que ela ja tem. */
export async function fillCustomerContact(
    id: string,
    values: { phone?: string | null; cpf?: string | null },
) {
    const patch: Record<string, string> = {};
    if (values.phone) patch.phone = values.phone;
    if (values.cpf) patch.cpf = values.cpf;
    if (!Object.keys(patch).length) return;
    await db.update(customers).set(patch).where(eq(customers.id, id));
}

export function acceptResaleTerm(customerId: string, version: number, ip: string | null) {
    return db
        .update(customers)
        .set({
            resaleTermVersion: version,
            resaleTermAcceptedAt: new Date(),
            resaleTermAcceptedIp: ip,
        })
        .where(eq(customers.id, customerId));
}

export function insertSession(values: { tokenHash: string; customerId: string; userAgent: string; expiresAt: Date }) {
    return db.insert(customerSessions).values(values);
}

export function findActiveSessionByTokenHash(tokenHash: string) {
    return db.query.customerSessions.findFirst({
        where: and(eq(customerSessions.tokenHash, tokenHash), gt(customerSessions.expiresAt, new Date())),
    });
}

export function deleteSessionByTokenHash(tokenHash: string) {
    return db.delete(customerSessions).where(eq(customerSessions.tokenHash, tokenHash));
}

export function deleteSessionsByCustomerId(customerId: string) {
    return db.delete(customerSessions).where(eq(customerSessions.customerId, customerId));
}

export function insertResetToken(values: { customerId: string; tokenHash: string; expiresAt: Date }) {
    return db.insert(passwordResetTokens).values(values);
}

export function findValidResetToken(tokenHash: string) {
    return db.query.passwordResetTokens.findFirst({
        where: and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date()),
            isNull(passwordResetTokens.usedAt),
        ),
    });
}

export function markResetTokenUsed(id: string) {
    return db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
}

export function updateCustomerPassword(customerId: string, passwordHash: string) {
    return db.update(customers).set({ passwordHash }).where(eq(customers.id, customerId));
}

export function findCustomerByGoogleId(googleId: string) {
    return db.query.customers.findFirst({ where: eq(customers.googleId, googleId) });
}

export function linkGoogleAccount(customerId: string, googleId: string) {
    return db.update(customers).set({ googleId }).where(eq(customers.id, customerId));
}

export async function insertGoogleCustomer(values:
    {
        name: string;
        email: string;
        googleId: string
    }) {

    const [customer] = await db.insert(customers).values(values).returning();
    return customer;
}