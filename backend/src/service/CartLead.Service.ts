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

/**
 * O carrinho da cliente LOGADA e convertido para o formato enxuto antes de
 * subir. Esta rota recebia o objeto do navegador CRU — o produto inteiro, com
 * descricao em HTML, todas as imagens e o preco do dia. Duas consequencias
 * reais, medidas em 27/09/2026:
 *
 * 1. O tamanho chega como `selectedSize`, nao `size`. O e-mail de carrinho
 *    abandonado monta a linha com `escapeHtml(i.size)` e quebrava em "Cannot
 *    read properties of undefined". Duas clientes estavam presas na fila,
 *    selecionadas de hora em hora, sem nunca receber o lembrete — que e
 *    exatamente o que esta rota foi criada para permitir.
 * 2. Um carrinho de 11 itens ocupava 56 KB, metade da tabela inteira, e esse
 *    peso vai e volta do banco a cada gravacao.
 */
function enxugar(items: unknown[]): CartItem[] {
    const texto = (v: unknown) => (typeof v === 'string' ? v : '');

    return items
        .map((bruto) => {
            const i = (bruto ?? {}) as Record<string, unknown>;
            return {
                productId: texto(i.productId) || texto(i.id),
                name: texto(i.name),
                size: texto(i.size) || texto(i.selectedSize),
                color: texto(i.color) || texto(i.selectedColor) || undefined,
                quantity: Number(i.quantity) || 1,
                selected: i.selected !== false,
            };
        })
        // Item sem produto nao serve para lembrar nem para recompor o carrinho.
        .filter((i) => i.productId !== '');
}

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

    const itens = enxugar(input.items);
    if (itens.length === 0) return { guardado: false };

    await CartRepository.upsert(cliente.id, itens);

    return { guardado: true };
}
