import { createHash } from 'crypto';

// Desconto de carrinho abandonado: 5% para quem ainda NAO comprou nenhuma vez,
// no lugar dos 3% da primeira compra. Somado aos 5% do PIX, sao 10% nas pecas.
//
// O lembrete sem desconto foi para 29 carrinhos ate 15/10/2026 e so 1 voltou.
// A Chris decidiu: o desconto e o motivo para voltar, mas so na primeira vez —
// quem ja e cliente volta sozinha, e desconto que se repete vira tabela de
// preco.
//
// O cupom e PESSOAL. O codigo sai da propria cliente (hash do id), entao:
//   - nao precisa de coluna nova no banco (o banco e o mesmo do painel);
//   - o carrinho acha o cupom dela sozinho, sem link nem codigo para digitar;
//   - codigo que vaza num grupo nao serve para mais ninguem (o checkout
//     confere o dono).
// Cada cliente tem UM codigo para sempre: a segunda vez que abandona nao gera
// outro desconto.
export const PREFIXO = 'VOLTA-';
export const PERCENTUAL = 5;
export const VALIDADE_HORAS = 48;

export function codigoDoCarrinho(customerId: string): string {
    const hash = createHash('sha256').update(`carrinho-abandonado:${customerId}`).digest('hex');
    return PREFIXO + hash.slice(0, 6).toUpperCase();
}

export function ehCupomDoCarrinho(code: string): boolean {
    return code.trim().toUpperCase().startsWith(PREFIXO);
}

// Cupom de carrinho so vale para a dona. Os outros cupons nao tem dono.
export function podeUsar(code: string, customerId: string | null): boolean {
    if (!ehCupomDoCarrinho(code)) return true;
    return !!customerId && code.trim().toUpperCase() === codigoDoCarrinho(customerId);
}

// "quinta, 17/10 às 15h" no horario de Brasilia — e o prazo que a cliente le.
export function prazoPorExtenso(ate: Date): string {
    const partes = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        hour12: false,
    }).formatToParts(ate);
    const p = (t: string) => partes.find((x) => x.type === t)?.value ?? '';
    const dia = p('weekday').replace('-feira', '');
    return `${dia}, ${p('day')}/${p('month')} às ${Number(p('hour'))}h`;
}
