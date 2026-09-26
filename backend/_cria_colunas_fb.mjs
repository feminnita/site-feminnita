/**
 * Cria as colunas `fbp` e `fbc` na tabela de pedidos.
 *
 * ⚠️ TEM QUE RODAR ANTES DO DEPLOY. O Drizzle consulta TODAS as colunas que o
 * schema declara; se o codigo novo subir antes das colunas existirem, toda
 * consulta de pedido quebra e a loja para de vender. Coluna primeiro, deploy
 * depois — nunca o contrario.
 *
 * Seguro de rodar duas vezes: usa IF NOT EXISTS e nao toca em dado nenhum.
 * So acrescenta duas colunas de texto vazias.
 *
 * Uso:
 *   node _cria_colunas_fb.mjs            -> so mostra o que vai fazer
 *   node _cria_colunas_fb.mjs --aplicar  -> cria de verdade
 */
import 'dotenv/config';
import pg from 'pg';

const APLICAR = process.argv.includes('--aplicar');

const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function colunasExistentes() {
    const { rows } = await c.query(
        `select column_name from information_schema.columns
          where table_name = 'orders' and column_name in ('fbp', 'fbc')`,
    );
    return rows.map((r) => r.column_name);
}

async function main() {
    await c.connect();

    const antes = await colunasExistentes();
    console.log('ANTES  — colunas presentes:', antes.length ? antes.join(', ') : 'nenhuma');

    if (antes.length === 2) {
        console.log('\nJa existem as duas. Nada a fazer — pode fazer o deploy.');
        await c.end();
        return;
    }

    if (!APLICAR) {
        console.log('\nVai executar:');
        console.log("  alter table orders add column if not exists fbp text;");
        console.log("  alter table orders add column if not exists fbc text;");
        console.log('\n(ensaio: nada foi criado — rode com --aplicar)');
        await c.end();
        return;
    }

    await c.query('alter table orders add column if not exists fbp text');
    await c.query('alter table orders add column if not exists fbc text');

    const depois = await colunasExistentes();
    console.log('DEPOIS — colunas presentes:', depois.join(', '));
    console.log(
        depois.length === 2
            ? '\n>>> OK. Agora pode fazer o deploy.'
            : '\n>>> ALGO FALHOU: nao crie o deploy ainda.',
    );
    await c.end();
}

void main().catch((e) => {
    console.error('ERRO:', e.message);
    process.exit(1);
});
