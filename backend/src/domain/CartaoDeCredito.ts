/**
 * Regras do pagamento no cartao que nao dependem de banco nem do Asaas.
 *
 * Ficam aqui, separadas do Order.Service, para poderem ser testadas sem
 * DATABASE_URL e sem chamar o Asaas de verdade.
 */

// ---------------------------------------------------------------------------
// Titular diferente da compradora
//
// De 10 a 17/10/2026, 16 de 30 tentativas no cartao foram recusadas pelo
// emissor. O pedido mandava SEMPRE os dados da conta como titular
// (creditCardHolderInfo): quando a revendedora paga com o cartao do marido ou
// da mae, CPF e CEP nao batem com o do cartao e o banco recusa.
// ---------------------------------------------------------------------------

export type TitularDoCartao = {
    nome: string;
    cpf: string; // so digitos
    cep: string; // so digitos
    numero: string;
    telefone: string; // so digitos
};

export function soDigitos(v: unknown): string {
    return String(v ?? '').replace(/\D/g, '');
}

/** CPF com digito verificador. Rejeita sequencias repetidas (111.111.111-11). */
export function cpfValido(cpf: unknown): boolean {
    const d = soDigitos(cpf);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (const tamanho of [9, 10]) {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
        const digito = ((soma * 10) % 11) % 10;
        if (digito !== Number(d[tamanho])) return false;
    }
    return true;
}

export function cepValido(cep: unknown): boolean {
    return soDigitos(cep).length === 8;
}

function invalido(mensagem: string): never {
    throw new Error(`CARD_HOLDER_INVALID: ${mensagem}`);
}

/**
 * Confere de novo, no servidor, o que a tela ja conferiu. A tela e sugestao;
 * quem decide e aqui.
 */
export function validarTitular(bruto: unknown): TitularDoCartao {
    const t = (bruto ?? {}) as Record<string, unknown>;
    const nome = String(t.nome ?? '').trim().replace(/\s+/g, ' ');
    const cpf = soDigitos(t.cpf);
    const cep = soDigitos(t.cep);
    const numero = String(t.numero ?? '').trim();
    const telefone = soDigitos(t.telefone);

    if (nome.length < 3 || nome.length > 100) invalido('Informe o nome completo do titular do cartão.');
    if (!cpfValido(cpf)) invalido('CPF do titular do cartão inválido. Confira os números.');
    if (!cepValido(cep)) invalido('CEP do titular do cartão inválido. Use os 8 números.');
    if (!numero || numero.length > 20) invalido('Informe o número do endereço do titular do cartão.');
    if (!/^\d{10,11}$/.test(telefone)) invalido('Informe o telefone do titular do cartão com DDD.');

    return { nome, cpf, cep, numero, telefone };
}

export type HolderInfo = {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
};

/**
 * O creditCardHolderInfo que vai ao Asaas.
 *
 * Sem titular informado, continua como sempre foi: os dados da conta e o
 * endereco de entrega. Com titular, nome/CPF/CEP/numero/telefone sao os dele;
 * o e-mail segue o da compradora (e para ela que o Asaas manda o recibo).
 */
export function montarHolderInfo(
    compradora: { name: string; email: string; cpf: string; phone?: string | null },
    entrega: { cep: string; number: string },
    titular?: TitularDoCartao | null,
): HolderInfo {
    if (!titular) {
        return {
            name: compradora.name,
            email: compradora.email,
            cpfCnpj: compradora.cpf,
            postalCode: entrega.cep,
            addressNumber: entrega.number,
            phone: compradora.phone ?? undefined,
        };
    }
    return {
        name: titular.nome,
        email: compradora.email,
        cpfCnpj: titular.cpf,
        postalCode: titular.cep,
        addressNumber: titular.numero,
        phone: titular.telefone,
    };
}

// ---------------------------------------------------------------------------
// Mensagem de recusa que a cliente entende
//
// Antes toda resposta 400 do Asaas virava CARD_DECLINED e a tela dizia a mesma
// frase para limite, dado errado e banco que barrou. Agora o codigo diz o
// motivo e a mensagem diz o que fazer. Todos comecam com CARD_DECLINED: uma
// tela antiga (cache da Vercel durante a publicacao) continua reconhecendo.
// ---------------------------------------------------------------------------

export type CodigoDeRecusa =
    | 'CARD_DECLINED_LIMIT'
    | 'CARD_DECLINED_DATA'
    | 'CARD_DECLINED_BANK'
    | 'CARD_DECLINED';

export const MENSAGENS_DE_RECUSA: Record<CodigoDeRecusa, string> = {
    CARD_DECLINED_LIMIT:
        'O banco recusou o pagamento por falta de limite disponível no cartão. Você pode usar outro cartão ou pagar com Pix, que é aprovado na hora e ainda tem desconto.',
    CARD_DECLINED_DATA:
        'Os dados do cartão ou do titular não conferem com os do banco. Confira número, validade e código de segurança. Se o cartão for de outra pessoa, marque "O cartão é de outra pessoa" e informe os dados do titular.',
    CARD_DECLINED_BANK:
        'O banco do cartão não autorizou esta compra. Se os dados estão certos, ligue para o banco (o telefone fica no verso do cartão) e peça para liberar a compra, ou pague com Pix, que é aprovado na hora e tem desconto.',
    CARD_DECLINED:
        'Seu cartão não foi aprovado. Confira os dados do cartão ou pague com Pix, que é aprovado na hora e ainda tem desconto.',
};

function semAcento(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Junta code + description de cada erro que o Asaas devolveu no corpo. */
function textoDoAsaas(motivo: string): string {
    const inicio = motivo.indexOf('{');
    if (inicio >= 0) {
        try {
            const corpo = JSON.parse(motivo.slice(inicio)) as { errors?: { code?: string; description?: string }[] };
            if (Array.isArray(corpo.errors) && corpo.errors.length > 0) {
                return corpo.errors.map((e) => `${e.code ?? ''} ${e.description ?? ''}`).join(' | ');
            }
        } catch {
            // corpo nao e JSON: usa o texto inteiro
        }
    }
    return motivo;
}

/**
 * Le a recusa do Asaas e diz o motivo em codigo e em portugues. Nunca devolve
 * o texto tecnico do Asaas para a tela.
 */
export function classificarRecusa(motivoDoAsaas: string): { codigo: CodigoDeRecusa; mensagem: string } {
    const t = semAcento(textoDoAsaas(motivoDoAsaas));

    let codigo: CodigoDeRecusa = 'CARD_DECLINED';
    if (/limite|saldo insuficiente|insufficient/.test(t)) {
        codigo = 'CARD_DECLINED_LIMIT';
    } else if (
        /titular|holder|cpf|cnpj|\bcep\b|postal|codigo de seguranca|\bccv\b|\bcvv\b|validade|expirad|vencid|numero do cartao|cartao invalido/.test(t)
    ) {
        codigo = 'CARD_DECLINED_DATA';
    } else if (/nao autorizad|recusad|negad|not authorized|declined|invalid_creditcard/.test(t)) {
        codigo = 'CARD_DECLINED_BANK';
    }
    return { codigo, mensagem: MENSAGENS_DE_RECUSA[codigo] };
}

/** O erro que sobe para a tela: "CODIGO: mensagem". */
export function erroDeRecusa(motivoDoAsaas: string): Error {
    const { codigo, mensagem } = classificarRecusa(motivoDoAsaas);
    return new Error(`${codigo}: ${mensagem}`);
}

// ---------------------------------------------------------------------------
// Limite de tentativas
//
// Cliente que insiste no mesmo cartao recusado nao passa na 3a vez — so gera
// pedido cancelado e chance de bloqueio do cartao por suspeita. Depois de 2
// recusas do mesmo CPF em 30 minutos, o cartao fica fechado e a tela oferece
// so o Pix.
// ---------------------------------------------------------------------------

export const MAX_RECUSAS = 2;
export const JANELA_RECUSAS_MIN = 30;

export const MENSAGEM_LIMITE_DE_RECUSAS =
    'Seu cartão foi recusado 2 vezes nos últimos 30 minutos. Para sua segurança, novas tentativas no cartão ficam pausadas por meia hora. Finalize agora com Pix: é aprovado na hora e ainda tem desconto.';

/**
 * Recusa a tentativa de cartao quando o CPF ja levou MAX_RECUSAS recusas na
 * janela. `contar` vem de fora (o repositorio em producao, um mock no teste).
 */
export async function garantirLimiteDeRecusas(
    cpf: string | null | undefined,
    contar: (cpf: string, minutos: number) => Promise<number>,
): Promise<void> {
    if (!cpf || soDigitos(cpf).length < 11) return;
    const recusas = await contar(cpf, JANELA_RECUSAS_MIN);
    if (recusas >= MAX_RECUSAS) {
        throw new Error(`CARD_RETRY_LIMIT: ${MENSAGEM_LIMITE_DE_RECUSAS}`);
    }
}
