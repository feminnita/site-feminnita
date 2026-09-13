/**
 * Prova as regras do cashback rodando o CODIGO DE VERDADE (nao uma copia da
 * logica): importa o dominio e confere caso a caso.
 *
 * Uso: npx tsx _prova_cashback.ts
 */
import { calcularCashbackCents, lerRegras, REGRAS_PADRAO } from './src/domain/Cashback.Domain';

let falhou = false;
const ok = (nome: string, teve: unknown, espera: unknown) => {
    const bateu = JSON.stringify(teve) === JSON.stringify(espera);
    if (!bateu) falhou = true;
    console.log(`  ${bateu ? 'OK  ' : 'ERRO'} ${nome.padEnd(46)} teve ${JSON.stringify(teve)} | esperado ${JSON.stringify(espera)}`);
};

console.log('=== desligado por padrao ===');
ok('padrao vem desligado', REGRAS_PADRAO.ativo, false);
ok('config vazia nao credita nada', calcularCashbackCents(50000, 0, lerRegras({})), 0);
ok('config nula nao credita nada', calcularCashbackCents(50000, 0, lerRegras(null)), 0);
ok('percentual sem ativo nao credita', calcularCashbackCents(50000, 0, lerRegras({ percentual: 10 })), 0);

console.log('\n=== a conta ===');
const r5 = lerRegras({ ativo: true, percentual: 5 });
ok('5% de R$ 500', calcularCashbackCents(50000, 0, r5), 2500);
ok('frete nao entra (so recebe produtos)', calcularCashbackCents(10000, 0, r5), 500);
ok('com cupom, sobre o que entrou', calcularCashbackCents(50000, 20000, r5), 1500);
ok('desconto maior que o subtotal', calcularCashbackCents(5000, 9000, r5), 0);

console.log('\n=== minimo de pedido ===');
const rMin = lerRegras({ ativo: true, percentual: 5, minimoPedido: 199 });
ok('abaixo do minimo nao ganha', calcularCashbackCents(19800, 0, rMin), 0);
ok('no minimo exato ganha', calcularCashbackCents(19900, 0, rMin), 995);
ok('cupom que derruba abaixo do minimo', calcularCashbackCents(25000, 6000, rMin), 0);

console.log('\n=== teto por pedido ===');
const rTeto = lerRegras({ ativo: true, percentual: 10, tetoPorPedido: 50 });
ok('sem estourar o teto', calcularCashbackCents(30000, 0, rTeto), 3000);
ok('estourando, corta no teto', calcularCashbackCents(200000, 0, rTeto), 5000);

console.log('\n=== config ruim nao vira credito errado ===');
ok('percentual em texto', calcularCashbackCents(10000, 0, lerRegras({ ativo: true, percentual: 'dez' })), 0);
ok('percentual negativo', calcularCashbackCents(10000, 0, lerRegras({ ativo: true, percentual: -5 })), 0);
ok('percentual acima de 100 e travado em 100', calcularCashbackCents(10000, 0, lerRegras({ ativo: true, percentual: 900 })), 10000);
ok('ativo como string nao liga', calcularCashbackCents(10000, 0, lerRegras({ ativo: 'sim', percentual: 10 })), 0);

console.log(`\nVEREDITO: ${falhou ? 'FALHOU' : 'OK'}`);
process.exitCode = falhou ? 1 : 0;
