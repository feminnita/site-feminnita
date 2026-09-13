import {
    pgTable, pgEnum, uuid, text, numeric, timestamp, index,
} from 'drizzle-orm/pg-core';
import { customers } from '../users/customers';
import { orders } from '../order/orders';

// Programa de afiliadas: influenciadora divulga, ganha comissao sobre o que
// vender. Decisao da Chris em 13/09/2026: sao parceiras EXTERNAS (nao
// revendedoras), cada uma aprovada por ela, e o pagamento sai por fora — o
// painel mostra quanto deve e ela marca como pago.
export const statusAfiliadaEnum = pgEnum('affiliate_status', [
    'pendente',   // se inscreveu, esperando a Chris aprovar
    'aprovada',   // divulgando, ganhando comissao
    'pausada',    // parou por acordo; o link ainda credita o que ja veio
    'bloqueada',  // o link para de creditar
]);

export const afiliadas = pgTable(
    'affiliates',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        nome: text('name').notNull(),
        email: text('email').notNull().unique(),
        telefone: text('phone'),
        instagram: text('instagram'),

        // O que vai no link: feminnita.com.br/?ref=MARIA10. Em maiuscula e sem
        // acento, porque e digitado e falado — "erre é efe" nao pode virar erro.
        codigo: text('code').notNull().unique(),

        // Percentual sobre o valor dos PRODUTOS do pedido (sem frete: frete nao
        // e margem, pagar comissao sobre ele seria dinheiro saindo a toa).
        percentual: numeric('commission_rate', { precision: 5, scale: 2 }).notNull().default('10'),

        status: statusAfiliadaEnum('status').notNull().default('pendente'),

        // Para a Chris pagar. Fica aqui e nao no pagamento porque a chave e da
        // pessoa, nao do pagamento — e ela troca de vez em quando.
        chavePix: text('pix_key'),

        observacoes: text('notes'),

        criadaEm: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        aprovadaEm: timestamp('approved_at', { withTimezone: true }),
    },
    (t) => ({
        // O checkout resolve o codigo do link a cada pedido.
        porCodigo: index('affiliates_codigo_idx').on(t.codigo),
    }),
);

// O que a Chris ja pagou para cada afiliada.
//
// Sem esta tabela nao da para saber o que falta pagar: o painel mostraria
// sempre o total historico, e ela pagaria duas vezes. "A pagar" = comissao dos
// pedidos pagos MENOS o que ja saiu daqui.
export const pagamentosAfiliada = pgTable(
    'affiliate_payouts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        afiliadaId: uuid('affiliate_id')
            .notNull()
            .references(() => afiliadas.id, { onDelete: 'cascade' }),
        valor: numeric('amount', { precision: 10, scale: 2 }).notNull(),
        // Como saiu (pix, transferencia, produto). Texto livre: a vida real nao
        // cabe numa lista fechada.
        forma: text('method'),
        observacao: text('note'),
        pagoEm: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        porAfiliada: index('affiliate_payouts_afiliada_idx').on(t.afiliadaId),
    }),
);

export const tipoCashbackEnum = pgEnum('cashback_kind', [
    'ganho',    // comprou e gerou credito
    'uso',      // gastou o credito numa compra (valor negativo)
    'estorno',  // o pedido que gerou foi cancelado (valor negativo)
    'ajuste',   // a Chris deu ou tirou na mao
]);

// Extrato de cashback da cliente — uma LINHA por movimento, nao um saldo.
//
// Um campo "saldo" no cliente seria mais simples e mais perigoso: quando a
// cliente reclamar que "tinha mais credito", e ela vai reclamar, nao haveria
// como mostrar de onde veio nem para onde foi. Aqui o saldo e a soma das
// linhas, e cada linha diz por que existe.
export const extratoCashback = pgTable(
    'cashback_entries',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        clienteId: uuid('customer_id')
            .notNull()
            .references(() => customers.id, { onDelete: 'cascade' }),
        // De qual pedido veio (ou em qual foi gasto). Nulo em ajuste manual.
        pedidoId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
        tipo: tipoCashbackEnum('kind').notNull(),
        // Positivo em ganho, negativo em uso e estorno. Somar a coluna da o saldo.
        valor: numeric('amount', { precision: 10, scale: 2 }).notNull(),
        motivo: text('note'),
        criadoEm: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        porCliente: index('cashback_entries_cliente_idx').on(t.clienteId),
    }),
);
