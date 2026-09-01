import { eq } from 'drizzle-orm';
import { db } from '../config/db';
import { customers } from '../db/schema';

export function findProfileById(id: string) {
    return db.query.customers.findFirst({
        where: eq(customers.id, id),
        columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
            birthDate: true,
        },
    });
}

export async function updateProfile(
    id: string,
    values: {
        name: string;
        phone?: string | null;
        cpf?: string | null;
        birthDate?: string | null
    },
) {
    const [customer] = await db
        .update(customers)
        .set(values)
        .where(eq(customers.id, id))
        .returning({
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
            cpf: customers.cpf,
            birthDate: customers.birthDate,
        });
    return customer;
}