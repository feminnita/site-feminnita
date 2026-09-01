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

export async function insertCustomer(values: { name: string; email: string; passwordHash: string }) {
    const [customer] = await db.insert(customers).values(values).returning();
    return customer;
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