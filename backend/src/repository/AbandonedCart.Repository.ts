import { sql } from 'drizzle-orm';
import { db } from '../config/db';
import { carts } from '../db/schema';

export type CarrinhoAbandonado = {
    customerId: string;
    name: string;
    email: string;
    items: { name: string; size: string; color?: string; quantity: number }[];
    updatedAt: Date;
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
               c.items        as "items",
               c.updated_at   as "updatedAt"
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

export async function marcarEnviado(customerId: string) {
    await db.execute(sql`
        update carts set abandoned_email_at = now() where customer_id = ${customerId}
    `);
}
