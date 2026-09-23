import * as AuthRepository from '../repository/Auth.Repository';
import * as CartRepository from '../repository/Cart.Repository';
import type { CartItem } from '../db/schema';

/**
 * Guarda o carrinho de quem AINDA NAO comprou, assim que ela se identifica.
 *
 * Depois que a conta deixou de ser obrigatoria — que foi o que destravou a
 * venda —, o carrinho passou a viver so no navegador da cliente. Medido em
 * 23/09/2026: 40 pessoas montaram carrinho, o banco guardou 6. O lembrete de
 * carrinho abandonado, que existe e funciona, alcancava 2 dessas 40. As outras
 * 38 escolheram peca, cor e tamanho, clicaram em comprar e sumiram sem deixar
 * rastro.
 *
 * Elas digitam o e-mail no checkout. Guardar ali, em vez de so no fim do
 * pedido, e o que permite lembra-las.
 *
 * Nao envia nada aqui: so registra. O job de carrinho abandonado cuida do
 * resto, com as mesmas 4 horas de espera de sempre.
 */

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function guardarCarrinhoDeVisitante(input: {
    email: string;
    name?: string | null;
    phone?: string | null;
    items: CartItem[];
}): Promise<{ guardado: boolean }> {
    const email = String(input.email ?? '').trim().toLowerCase();

    // Sem e-mail valido nao ha a quem lembrar. E-mail pela metade, digitado
    // enquanto a cliente ainda escreve, viraria cliente fantasma no cadastro.
    if (!EMAIL_VALIDO.test(email)) return { guardado: false };
    if (!Array.isArray(input.items) || input.items.length === 0) return { guardado: false };

    const existente = await AuthRepository.findCustomerByEmail(email);

    const cliente = existente ?? await AuthRepository.insertGuestCustomer({
        name: (input.name ?? '').trim() || 'Cliente',
        email,
        phone: input.phone ?? null,
    });

    // Cliente que ja existia pode estar sem telefone; completa sem sobrescrever
    // o que ela ja tem.
    if (existente && input.phone) {
        await AuthRepository.fillCustomerContact(existente.id, { phone: input.phone });
    }

    await CartRepository.upsert(cliente.id, input.items);

    return { guardado: true };
}
