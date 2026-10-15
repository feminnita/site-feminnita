import { sql } from 'drizzle-orm';
import { db } from '../config/db';
import { carts } from '../db/schema';

export type CarrinhoAbandonado = {
    customerId: string;
    name: string;
    email: string;
    items: { name: string; size: string; color?: string; quantity: number }[];
    updatedAt: Date;
    primeiraCompra: boolean;
};

// Quem realmente abandonou o carrinho.
//
// As condicoes existem todas por um motivo, e tirar qualquer uma cria um jeito
// de incomodar a cliente errada:
//   - parado ha X horas: cobrar quem ainda esta comprando afasta;
//   - carrinho com item: carrinho vazio nao e abandono;
//   - lembrete ainda nao enviado: ninguem recebe duas vezes pelo mesmo carrinho;
//   - SEM pedido depois do carrinho: o carrinho so e limpo pelo navegador, entao
//     sobra carrinho de quem JA COMPROU — mandar "voce esqueceu algo" para quem
//     acabou de pagar e o pior erro possivel deste e-mail;
//   - nao pediu para sair da lista: quem disse "nao me mande e-mail" vale para
//     tudo, nao so para novidade.
export async function encontrarAbandonados(horas: number, limite: number) {
    const resultado = await db.execute(sql`
        select c.customer_id  as "customerId",
               cl.name        as "name",
               cl.email       as "email",
               -- Carrinho de VISITANTE gravado antes de 27/09/2026 guardou o
               -- produto cru: o tamanho vem como "selectedSize" e a cor como
               -- "selectedColor". O e-mail monta a linha com escapeHtml(i.size)
               -- e quebrava nesses — duas clientes ficaram presas na fila,
               -- selecionadas de hora em hora, sem nunca receber o lembrete.
               -- Ler dos dois nomes faz o que ja esta gravado voltar a
               -- funcionar, sem reescrever nada. E devolve so os quatro campos
               -- que o e-mail usa, em vez do produto inteiro.
               (
                 select coalesce(jsonb_agg(jsonb_build_object(
                          'name',     i->>'name',
                          'size',     coalesce(i->>'size',  i->>'selectedSize',  ''),
                          'color',    coalesce(i->>'color', i->>'selectedColor'),
                          'quantity', coalesce((i->>'quantity')::int, 1)
                        )), '[]'::jsonb)
                 from jsonb_array_elements(c.items) i
               )              as "items",
               c.updated_at   as "updatedAt",
               -- Nunca fez pedido nenhum: e quem ganha os 5% do carrinho.
               -- Mesma regra do cupom de primeira compra no checkout.
               not exists (select 1 from orders o where o.customer_id = c.customer_id)
                              as "primeiraCompra"
        from carts c
        join customers cl on cl.id = c.customer_id
        where c.updated_at < now() - (${horas} || ' hours')::interval
          and jsonb_array_length(c.items) > 0
          and c.abandoned_email_at is null
          and cl.email is not null
          and not exists (
              select 1 from orders o
              where o.customer_id = c.customer_id
                and o.created_at > c.updated_at
          )
          and not exists (
              select 1 from newsletter_subscribers n
              where lower(n.email) = lower(cl.email)
                and n.unsubscribed_at is not null
          )
        order by c.updated_at asc
        limit ${limite}
    `);
    return resultado.rows as unknown as CarrinhoAbandonado[];
}

// Cria o cupom pessoal de carrinho abandonado e devolve a validade dele, ou
// null quando ela ja teve o dela (cada cliente tem um so, para sempre: quem
// abandona de novo recebe o lembrete sem desconto).
//
// Se o cupom ja existe, sem uso e com folga no prazo, devolve o mesmo: e o
// caso do e-mail que o Resend recusou na rodada anterior — sem isto ela
// receberia o lembrete de novo, mas sem o desconto que ja era dela.
export async function criarCupomDoCarrinho(codigo: string, percentual: number, horas: number) {
    const criado = await db.execute(sql`
        insert into coupons (code, type, value, max_uses, first_purchase_only, expires_at)
        values (${codigo}, 'percent', ${percentual}, 1, true, now() + (${horas} || ' hours')::interval)
        on conflict (code) do nothing
        returning expires_at as "expiresAt"
    `);
    type Linha = { expiresAt: Date | string } | undefined;
    let linha = criado.rows[0] as Linha;
    if (!linha) {
        const existente = await db.execute(sql`
            select expires_at as "expiresAt" from coupons
            where code = ${codigo} and active and used_count = 0
              and expires_at > now() + interval '6 hours'
        `);
        linha = existente.rows[0] as Linha;
    }
    return linha ? new Date(linha.expiresAt) : null;
}

export async function marcarEnviado(customerId: string) {
    await db.execute(sql`
        update carts set abandoned_email_at = now() where customer_id = ${customerId}
    `);
}
