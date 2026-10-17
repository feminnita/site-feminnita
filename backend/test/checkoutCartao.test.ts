// node --import tsx --test test/checkoutCartao.test.ts
// Sem banco e sem Asaas: as dependencias sao mocks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    cpfValido,
    cepValido,
    validarTitular,
    montarHolderInfo,
    classificarRecusa,
    erroDeRecusa,
    garantirLimiteDeRecusas,
    MENSAGENS_DE_RECUSA,
} from '../src/domain/CartaoDeCredito';
import { cancelarPixPendentesDoCpf, MOTIVO_SUBSTITUIDO, type DependenciasPix } from '../src/domain/PixSubstituido';

const CPF_OK = '529.982.247-25';
const titularOk = { nome: '  Maria   da Silva ', cpf: CPF_OK, cep: '28610-000', numero: '120', telefone: '(22) 99999-0000' };

// ---------------------------------------------------------------- titular

test('CPF: digito verificador', () => {
    assert.equal(cpfValido(CPF_OK), true);
    assert.equal(cpfValido('52998224725'), true);
    assert.equal(cpfValido('529.982.247-24'), false); // ultimo digito errado
    assert.equal(cpfValido('111.111.111-11'), false); // sequencia repetida
    assert.equal(cpfValido('5299822472'), false); // curto
    assert.equal(cpfValido(undefined), false);
});

test('CEP: 8 digitos', () => {
    assert.equal(cepValido('28610-000'), true);
    assert.equal(cepValido('28610000'), true);
    assert.equal(cepValido('2861000'), false);
    assert.equal(cepValido('286100000'), false);
});

test('titular valido sai normalizado', () => {
    assert.deepEqual(validarTitular(titularOk), {
        nome: 'Maria da Silva',
        cpf: '52998224725',
        cep: '28610000',
        numero: '120',
        telefone: '22999990000',
    });
});

test('titular invalido e recusado com CARD_HOLDER_INVALID e mensagem em portugues', () => {
    const casos: [Record<string, string>, RegExp][] = [
        [{ ...titularOk, nome: 'M' }, /nome/],
        [{ ...titularOk, cpf: '529.982.247-24' }, /CPF do titular/],
        [{ ...titularOk, cep: '2861-000' }, /CEP do titular/],
        [{ ...titularOk, numero: '  ' }, /número do endereço/],
        [{ ...titularOk, telefone: '9999-0000' }, /telefone do titular/],
    ];
    for (const [dado, texto] of casos) {
        assert.throws(() => validarTitular(dado), (e: Error) => {
            assert.match(e.message, /^CARD_HOLDER_INVALID: /);
            assert.match(e.message, texto);
            return true;
        });
    }
    assert.throws(() => validarTitular(null), /CARD_HOLDER_INVALID/);
});

// ---------------------------------------------------------------- creditCardHolderInfo

const compradora = { name: 'Ana Revendedora', email: 'ana@exemplo.com', cpf: '11144477735', phone: '21988887777' };
const entrega = { cep: '20000000', number: '10' };

test('sem titular: holderInfo igual a hoje (dados da conta + endereco de entrega)', () => {
    assert.deepEqual(montarHolderInfo(compradora, entrega, null), {
        name: 'Ana Revendedora',
        email: 'ana@exemplo.com',
        cpfCnpj: '11144477735',
        postalCode: '20000000',
        addressNumber: '10',
        phone: '21988887777',
    });
    // telefone vazio na conta continua indo como undefined
    assert.equal(montarHolderInfo({ ...compradora, phone: null }, entrega).phone, undefined);
});

test('com titular: nome, CPF, CEP, numero e telefone sao os do titular; e-mail o da compradora', () => {
    assert.deepEqual(montarHolderInfo(compradora, entrega, validarTitular(titularOk)), {
        name: 'Maria da Silva',
        email: 'ana@exemplo.com',
        cpfCnpj: '52998224725',
        postalCode: '28610000',
        addressNumber: '120',
        phone: '22999990000',
    });
});

// ---------------------------------------------------------------- mensagens de recusa

const asaas = (code: string, description: string) =>
    `ASASS_ERROR 400: ${JSON.stringify({ errors: [{ code, description }] })}`;

test('recusa generica do emissor vira "nao autorizada pelo banco"', () => {
    const r = classificarRecusa(asaas('invalid_creditCard', 'Transação não autorizada. Verifique os dados do cartão de crédito e tente novamente.'));
    assert.equal(r.codigo, 'CARD_DECLINED_BANK');
    assert.match(r.mensagem, /ligue para o banco/);
    assert.match(r.mensagem, /Pix/);
});

test('limite insuficiente', () => {
    const r = classificarRecusa(asaas('invalid_object', 'Não foi possível realizar a transação, verifique o limite disponível.'));
    assert.equal(r.codigo, 'CARD_DECLINED_LIMIT');
    assert.match(r.mensagem, /limite/);
});

test('dados do cartao ou do titular que nao conferem', () => {
    assert.equal(classificarRecusa(asaas('invalid_creditCardHolderInfo', 'O CPF/CNPJ do titular do cartão é inválido.')).codigo, 'CARD_DECLINED_DATA');
    assert.equal(classificarRecusa(asaas('invalid_creditCard', 'Cartão com validade expirada.')).codigo, 'CARD_DECLINED_DATA');
    assert.equal(classificarRecusa(asaas('invalid_creditCard', 'Código de segurança inválido.')).codigo, 'CARD_DECLINED_DATA');
    assert.match(classificarRecusa(asaas('invalid_creditCard', 'Informe o CEP do titular.')).mensagem, /outra pessoa/);
});

test('resposta que nao se entende cai na mensagem generica', () => {
    assert.equal(classificarRecusa('ASASS_ERROR 400: <html>erro</html>').codigo, 'CARD_DECLINED');
    assert.equal(classificarRecusa(asaas('qualquer_coisa', 'algo novo')).codigo, 'CARD_DECLINED');
});

test('nenhuma mensagem leva texto tecnico, e todo codigo comeca com CARD_DECLINED (tela antiga continua entendendo)', () => {
    for (const [codigo, mensagem] of Object.entries(MENSAGENS_DE_RECUSA)) {
        assert.match(codigo, /^CARD_DECLINED/);
        assert.doesNotMatch(mensagem, /ASAAS|ASASS|invalid_|errors|\{/i);
    }
    const e = erroDeRecusa(asaas('invalid_creditCard', 'Transação não autorizada.'));
    assert.match(e.message, /^CARD_DECLINED_BANK: O banco/);
    assert.doesNotMatch(e.message, /invalid_creditCard/);
});

// ---------------------------------------------------------------- limite de 2 recusas

test('ate 1 recusa em 30 min o cartao segue liberado', async () => {
    const chamadas: [string, number][] = [];
    const contar = async (cpf: string, min: number) => { chamadas.push([cpf, min]); return 1; };
    await garantirLimiteDeRecusas('111.444.777-35', contar);
    assert.deepEqual(chamadas, [['111.444.777-35', 30]]);
    await garantirLimiteDeRecusas('11144477735', async () => 0);
});

test('com 2 recusas a 3a tentativa e barrada com CARD_RETRY_LIMIT', async () => {
    for (const n of [2, 5]) {
        await assert.rejects(garantirLimiteDeRecusas('11144477735', async () => n), (e: Error) => {
            assert.match(e.message, /^CARD_RETRY_LIMIT: /);
            assert.match(e.message, /Pix/);
            return true;
        });
    }
});

test('sem CPF nao consulta nem barra', async () => {
    let consultou = false;
    const contar = async () => { consultou = true; return 9; };
    await garantirLimiteDeRecusas(null, contar);
    await garantirLimiteDeRecusas('123', contar);
    assert.equal(consultou, false);
});

// ---------------------------------------------------------------- Pix pendente

function montarDeps(opcoes: {
    pendentes?: { id: string; orderNumber: string; asaasPaymentId: string }[];
    status?: Record<string, string>;
    falhaNoAsaas?: string[];
    falhaAoBuscar?: boolean;
    falhaAoCancelarPedido?: boolean;
}) {
    const passos: string[] = [];
    const logs: unknown[][] = [];
    const deps: DependenciasPix = {
        buscarPixPendentes: async (cpf, horas, exceto) => {
            passos.push(`buscar ${cpf} ${horas}h exceto ${exceto}`);
            if (opcoes.falhaAoBuscar) throw new Error('banco fora');
            return opcoes.pendentes ?? [];
        },
        statusNoAsaas: async (id) => {
            passos.push(`status ${id}`);
            return opcoes.status?.[id] ?? 'PENDING';
        },
        cancelarNoAsaas: async (id) => {
            passos.push(`asaas-cancela ${id}`);
            if (opcoes.falhaNoAsaas?.includes(id)) throw new Error('ASASS_ERROR 400: nao pode');
        },
        cancelarPedido: async (id) => {
            passos.push(`pedido-cancela ${id}`);
            if (opcoes.falhaAoCancelarPedido) throw new Error('banco fora');
            return true;
        },
        marcarMotivo: async (id, motivo) => {
            passos.push(`motivo ${id} ${motivo}`);
        },
        log: (...args) => logs.push(args),
    };
    return { deps, passos, logs };
}

const pago = { id: 'pedido-cartao', orderNumber: 'ARM-2000' };

test('cartao aprovado cancela so o Pix PENDING, primeiro no Asaas e depois no banco', async () => {
    const { deps, passos } = montarDeps({
        pendentes: [
            { id: 'p1', orderNumber: 'ARM-1990', asaasPaymentId: 'pay_1' },
            { id: 'p2', orderNumber: 'ARM-1991', asaasPaymentId: 'pay_2' },
        ],
        status: { pay_2: 'RECEIVED' }, // pago no meio do caminho: nao toca
    });
    const r = await cancelarPixPendentesDoCpf('11144477735', pago, deps);

    assert.deepEqual(r, { cancelados: ['ARM-1990'], ignorados: ['ARM-1991'], falhas: [] });
    assert.deepEqual(passos, [
        'buscar 11144477735 24h exceto pedido-cartao',
        'status pay_1',
        'asaas-cancela pay_1',
        'pedido-cancela p1',
        `motivo p1 ${MOTIVO_SUBSTITUIDO}`,
        'status pay_2',
    ]);
});

test('falha no Asaas: o pedido Pix nao e cancelado no banco, os outros seguem e nada e lancado', async () => {
    const { deps, passos, logs } = montarDeps({
        pendentes: [
            { id: 'p1', orderNumber: 'ARM-1990', asaasPaymentId: 'pay_1' },
            { id: 'p2', orderNumber: 'ARM-1991', asaasPaymentId: 'pay_2' },
        ],
        falhaNoAsaas: ['pay_1'],
    });
    const r = await cancelarPixPendentesDoCpf('11144477735', pago, deps);

    assert.deepEqual(r, { cancelados: ['ARM-1991'], ignorados: [], falhas: ['ARM-1990'] });
    assert.equal(passos.includes('pedido-cancela p1'), false);
    assert.equal(passos.includes('pedido-cancela p2'), true);
    assert.equal(logs.length, 1);
});

test('banco fora ao buscar ou ao cancelar: nao derruba o pedido pago', async () => {
    const a = montarDeps({ falhaAoBuscar: true });
    assert.deepEqual(await cancelarPixPendentesDoCpf('11144477735', pago, a.deps), { cancelados: [], ignorados: [], falhas: [] });
    assert.equal(a.logs.length, 1);

    const b = montarDeps({
        pendentes: [{ id: 'p1', orderNumber: 'ARM-1990', asaasPaymentId: 'pay_1' }],
        falhaAoCancelarPedido: true,
    });
    const r = await cancelarPixPendentesDoCpf('11144477735', pago, b.deps);
    assert.deepEqual(r.falhas, ['ARM-1990']);
    assert.equal(b.logs.length, 1);
});

test('sem CPF nao procura nada', async () => {
    const { deps, passos } = montarDeps({});
    await cancelarPixPendentesDoCpf(null, pago, deps);
    assert.deepEqual(passos, []);
});
