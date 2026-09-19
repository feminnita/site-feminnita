/**
 * Cria o cupom de primeira compra (5%) e liga ele no pop-up de newsletter.
 *
 * O pop-up le a configuracao em site_settings.newsletter_popup — mesma chave
 * onde mora a foto. O codigo aparece na tela de sucesso, depois do e-mail:
 * o desconto e o motivo de dar o e-mail, nao um brinde solto na tela.
 *
 * Idempotente: se o cupom ja existir, atualiza em vez de duplicar.
 *
 * Uso:
 *   node scripts/cria_cupom_primeira_compra.mjs             (ensaio)
 *   node scripts/cria_cupom_primeira_compra.mjs --aplicar
 */
import 'dotenv/config';
import pg from 'pg';

const APLICAR = process.argv.includes('--aplicar');

const CODIGO = 'PRIMEIRA5';
const PERCENTUAL = 5;

const cliente = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

try {
    await cliente.connect();

    const { rows: existente } = await cliente.query(
        'select code, type, value, active, used_count, max_uses from coupons where upper(code) = $1',
        [CODIGO],
    );

    console.log(`cupom ${CODIGO}: ${existente.length ? 'JA EXISTE' : 'sera criado'}`);
    if (existente.length) console.log('  hoje: ' + JSON.stringify(existente[0]));

    console.log('\nvai ficar assim:');
    console.log(`  codigo         ${CODIGO}`);
    console.log(`  desconto       ${PERCENTUAL}% (percent)`);
    console.log('  pedido minimo  nenhum alem do minimo da loja');
    console.log('  usos totais    ilimitado');
    console.log('  validade       sem prazo');
    console.log('  ativo          sim');

    if (!APLICAR) {
        console.log('\n(ensaio: nada foi gravado — rode com --aplicar)');
        process.exit(0);
    }

    await cliente.query(
        `insert into coupons (code, type, value, min_order_value, max_uses, used_count, active, expires_at)
         values ($1, 'percent', $2, null, null, 0, true, null)
         on conflict (code) do update
            set type = 'percent', value = $2, min_order_value = null,
                max_uses = null, active = true, expires_at = null,
                updated_at = now()`,
        [CODIGO, PERCENTUAL],
    );

    // Liga no pop-up sem apagar a foto que ja esta configurada.
    await cliente.query(
        `insert into site_settings (key, value)
         values ('newsletter_popup', jsonb_build_object('cupom', $1::text, 'cupomTexto', $2::text))
         on conflict (key) do update
            set value = site_settings.value
                        || jsonb_build_object('cupom', $1::text, 'cupomTexto', $2::text)`,
        [CODIGO, `${PERCENTUAL}% de desconto na primeira compra`],
    );

    const { rows: cupom } = await cliente.query(
        'select code, type, value, active, max_uses from coupons where upper(code) = $1',
        [CODIGO],
    );
    const { rows: cfg } = await cliente.query(
        `select value from site_settings where key = 'newsletter_popup'`,
    );

    console.log('\ncupom gravado:');
    console.log('  ' + JSON.stringify(cupom[0]));
    console.log('configuracao do pop-up:');
    console.log('  ' + JSON.stringify(cfg[0].value));
} catch (e) {
    console.error('ERRO:', e.message);
    process.exitCode = 1;
} finally {
    await cliente.end().catch(() => {});
}
