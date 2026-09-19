import { and, desc, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { addresses } from '../db/schema';

type AddressInsert = typeof addresses.$inferInsert;

export function findByCustomerId(customerId: string) {
    return db.query.addresses.findMany({
        where: eq(addresses.customerId, customerId),
        orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)],
    });
}

export function findByIdAndCustomerId(id: string, customerId: string) {
    return db.query.addresses.findFirst({
        where: and(eq(addresses.id, id), eq(addresses.customerId, customerId)),
    });
}

export async function countByCustomerId(customerId: string) {
    const rows = await db.query.addresses.findMany({
        where: eq(addresses.customerId, customerId),
        columns: { id: true },
    });
    return rows.length;
}

export async function insert(values: AddressInsert) {
    const [address] = await db.insert(addresses).values(values).returning();
    return address;
}

export async function updateByIdAndCustomerId(id: string, customerId: string, values: Partial<AddressInsert>) {
    const [address] = await db
        .update(addresses)
        .set(values)
        .where(
            and(
                eq(addresses.id, id),
                eq(addresses.customerId, customerId)
            ))
        .returning();
    return address;
}

export async function deleteByIdAndCustomerId(id: string, customerId: string) {
    const [address] = await db
        .delete(addresses)
        .where(
            and(
                eq(addresses.id, id),
                eq(addresses.customerId, customerId)
            )
        )
        .returning();
    return address;
}

export async function setDefault(id: string, customerId: string) {
    return db.transaction(async (tx) => {
        await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, customerId));

        const [address] = await tx
            .update(addresses)
            .set({ isDefault: true })
            .where(and(
                eq(addresses.id, id),
                eq(addresses.customerId, customerId)
            ))
            .returning();
        return address;
    })
}

// Guarda na agenda da cliente o endereco digitado no checkout.
//
// O checkout LE a agenda para preencher sozinho, mas nunca escrevia nela: o
// endereco ia so para dentro do pedido. O ciclo ficava quebrado no meio, e a
// revendedora — que compra todo mes — redigitava CEP, rua, numero e bairro em
// toda compra, no celular.
//
// Duplicata e evitada por CEP + numero, nao pelo texto da rua: a mesma pessoa
// escreve "Rua" numa vez e "R." na outra, e comparar texto encheria a agenda de
// enderecos iguais com grafias diferentes.
//
// O primeiro endereco nasce como padrao; os seguintes, nao — mudar o padrao
// sozinho faria a compra seguinte sair para o endereco errado.
export async function saveFromCheckout(
    customerId: string,
    endereco: {
        cep: string;
        street: string;
        number: string;
        complement?: string | null;
        neighborhood: string;
        city: string;
        state: string;
    },
): Promise<void> {
    const soDigitos = (v: string) => (v ?? '').replace(/\D/g, '');
    const cep = soDigitos(endereco.cep);
    const numero = (endereco.number ?? '').trim();

    if (!cep || !numero || !endereco.street || !endereco.city) return;

    const jaTem = await db.query.addresses.findMany({
        where: eq(addresses.customerId, customerId),
    });

    const repetido = jaTem.some(
        (a) => soDigitos(a.cep) === cep && (a.number ?? '').trim() === numero,
    );
    if (repetido) return;

    await db.insert(addresses).values({
        customerId,
        cep: endereco.cep,
        street: endereco.street,
        number: numero,
        complement: endereco.complement ?? null,
        neighborhood: endereco.neighborhood,
        city: endereco.city,
        state: endereco.state,
        isDefault: jaTem.length === 0,
    });
}
