/**
 * Recria a order_number_seq, que se perdeu na reconstrucao do banco.
 *
 * O restore trouxe as 29 tabelas e as 9.771 linhas, mas sequencia nao e tabela:
 * ficou para tras e ninguem notou, porque nada le uma sequencia — so o pedido
 * NOVO precisa dela. O erro apareceu no primeiro teste de compra depois da
 * virada: "relation order_number_seq does not exist", e nenhum pedido podia
 * nascer.
 *
 * O ponto de partida nao e 1000 (o valor original): e o maior FEM-xxxx que ja
 * existe, mais um. Comecar do zero faria a loja repetir numero de pedido ja
 * entregue — dois pedidos diferentes com a mesma identidade na nota, no Bling e
 * no e-mail da cliente.
 *
 * Idempotente: se a sequencia ja existir, nao mexe.
 *
 * Uso:
 *   node scripts/restaura_sequencia_pedido.mjs             (ensaio)
 *   node scripts/restaura_sequencia_pedido.mjs --aplicar
 */
import 'dotenv/config';
import pg from 'pg';

const APLICAR = process.argv.includes('--aplicar');

const cliente = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

try {
    await cliente.connect();

    const { rows: existe } = await cliente.query(
        `select last_value from pg_sequences where schemaname='public' and sequencename='order_number_seq'`,
    );

    if (existe.length) {
        console.log(`order_number_seq JA EXISTE (valor atual ${existe[0].last_value}). Nada a fazer.`);
        process.exit(0);
    }

    // FEM-1017 -> 1017. Ignora qualquer numero fora desse formato.
    const { rows: maior } = await cliente.query(`
        select coalesce(max((regexp_replace(order_number, '\\D', '', 'g'))::bigint), 999) as maior
        from orders
        where order_number ~ '^FEM-[0-9]+$'
    `);

    const proximo = Number(maior[0].maior) + 1;

    console.log('order_number_seq: NAO EXISTE');
    console.log(`  maior numero ja usado: FEM-${maior[0].maior}`);
    console.log(`  vai ser criada comecando em: ${proximo}  (proximo pedido: FEM-${proximo})`);

    if (!APLICAR) {
        console.log('\n(ensaio: nada foi criado — rode com --aplicar)');
        process.exit(0);
    }

    await cliente.query(`CREATE SEQUENCE order_number_seq START WITH ${proximo}`);

    const { rows: conferencia } = await cliente.query(
        `select last_value from pg_sequences where schemaname='public' and sequencename='order_number_seq'`,
    );
    console.log(`\ncriada. proximo valor: ${conferencia[0].last_value} -> FEM-${conferencia[0].last_value}`);
} catch (e) {
    console.error('ERRO:', e.message);
    process.exitCode = 1;
} finally {
    await cliente.end().catch(() => {});
}
