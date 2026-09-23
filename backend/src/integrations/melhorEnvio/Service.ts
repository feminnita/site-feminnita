import * as MelhorEnvio from '../melhorEnvio/Clients';
import { combinePackage } from '../melhorEnvio/Domain';
import type { ShippingQuoteOption } from './types';

export type QuotableItem = Parameters<typeof combinePackage>[0][number];

/**
 * @param valorSegurado Valor da mercadoria, para o seguro entrar na cotacao.
 *
 * Sem isto a loja cotava frete SEM seguro e cobrava esse preco da cliente,
 * enquanto a etiqueta saia com o valor cheio declarado — e a diferenca ficava
 * com a Chris, calada, em todo pedido. Medido no FEM-1028: R$ 75,73 cobrados
 * da cliente, R$ 86,79 pagos ao Melhor Envio.
 *
 * O seguro nao e opcional aqui — "o indice de roubo e absurdo" —, entao ele
 * precisa aparecer no preco em vez de virar prejuizo invisivel.
 */
export async function quoteShipping(
    toCep: string,
    items: QuotableItem[],
    valorSegurado?: number,
): Promise<ShippingQuoteOption[]> {
    const pkg = combinePackage(items);
    const resposta = await MelhorEnvio.calculate(toCep, pkg, valorSegurado);

    // O Melhor Envio nem sempre devolve uma LISTA: quando sobra uma
    // transportadora só, vem o objeto sozinho. O `.filter` abaixo estourava,
    // o erro subia até o controller e o checkout ficava sem NENHUMA opção —
    // inclusive sem a retirada na fábrica, que nem depende de transportadora.
    const rawOptions = Array.isArray(resposta) ? resposta : [resposta];

    const cotadas = rawOptions
        .filter((option) => !option.error && option.price)
        .map((option) => ({
            id: option.id,
            name: option.name,
            company: option.company?.name ?? '',
            price: option.price!,
            deliveryDays: option.delivery_time ?? 0,
        }))
        // Mais barata primeiro. Com uma opcao so a ordem nao importava; com
        // catorze, deixar a cara no topo e cobrar caro de quem nao rola a lista.
        .sort((a, b) => Number(a.price) - Number(b.price));

    return enxugar(cotadas);
}

// Transportadoras que a Chris aceita. Azul Cargo e LATAM sairam por decisao
// dela: num pedido de R$ 214 a LATAM cotou R$ 111,95, e frete que custa metade
// da compra nao e opcao, e ruido.
const ACEITAS = ['correios', 'jadlog', 'loggi', 'jet', 'total express', 'buslog'];

// Correios entra com PAC e SEDEX: um e o barato, o outro e o rapido, e a Chris
// faz questao dos dois porque ha cliente que so confia em Correios. As demais
// entram com UMA opcao, a mais barata — Jadlog sozinha tem tres servicos, e
// catorze linhas na tela nao e escolha, e paralisia.
const COM_DUAS = 'correios';

function enxugar(opcoes: ShippingQuoteOption[]): ShippingQuoteOption[] {
    const jaTem = new Set<string>();

    return opcoes.filter((o) => {
        const empresa = o.company.trim().toLowerCase();
        if (!ACEITAS.some((aceita) => empresa.includes(aceita))) return false;
        if (empresa.includes(COM_DUAS)) return true;

        if (jaTem.has(empresa)) return false;
        jaTem.add(empresa);
        return true;
    });
}
