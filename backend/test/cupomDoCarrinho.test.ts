// node --import tsx --test test/cupomDoCarrinho.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codigoDoCarrinho, ehCupomDoCarrinho, podeUsar, prazoPorExtenso } from '../src/domain/CupomDoCarrinho';

const ANA = '5f1c9a52-0d7e-4c8b-9a1e-2b3c4d5e6f70';
const BIA = 'a8e2b4c6-1f3d-4a5b-8c7d-9e0f1a2b3c4d';

test('cada cliente tem um codigo fixo, diferente das outras', () => {
    assert.equal(codigoDoCarrinho(ANA), codigoDoCarrinho(ANA));
    assert.notEqual(codigoDoCarrinho(ANA), codigoDoCarrinho(BIA));
    assert.match(codigoDoCarrinho(ANA), /^VOLTA-[0-9A-F]{6}$/);
});

test('cupom de carrinho so vale para a dona', () => {
    const daAna = codigoDoCarrinho(ANA);
    assert.equal(podeUsar(daAna, ANA), true);
    assert.equal(podeUsar(daAna.toLowerCase(), ANA), true);
    assert.equal(podeUsar(daAna, BIA), false); // vazou num grupo: nao serve
    assert.equal(podeUsar(daAna, null), false); // sem saber quem e, nao vale
});

test('os outros cupons continuam sem dono', () => {
    assert.equal(ehCupomDoCarrinho('PRIMEIRA3'), false);
    assert.equal(podeUsar('PRIMEIRA3', null), true);
    assert.equal(podeUsar('FICA6', BIA), true);
});

test('prazo no horario de Brasilia', () => {
    // 17/10/2026 18:00 UTC = 15h em Brasilia, sabado
    assert.equal(prazoPorExtenso(new Date('2026-10-17T18:00:00Z')), 'sábado, 17/10 às 15h');
    assert.equal(prazoPorExtenso(new Date('2026-10-15T23:30:00Z')), 'quinta, 15/10 às 20h');
});
