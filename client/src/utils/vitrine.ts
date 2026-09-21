import { normalizeColorKey } from "./product";
import type { CategoryRow } from "../types/categories/categories";
import type { StoreProduct } from "../types/product/products";

// UM CARD POR COR nas listagens.
//
// O masculino tem 6 produtos divididos em tres setores: cada linha da grade
// mostrava 2 cards e deixava metade da tela vazia. Mas a Feminnita nao vende 6
// coisas no masculino — vende 44 estampas. Elas estavam todas escondidas atras
// de um clique, e a pagina parecia um catalogo pobre.
//
// A regra e a foto: so vira card a cor que tem FOTO PROPRIA. Cor sem foto
// repetiria a mesma imagem do lado, o que e pior que o buraco — essas
// continuam so dentro da pagina do produto. Conforme a Chris fotografa, a
// vitrine se enche sozinha, sem ninguem mexer em codigo.
export type CardDeVitrine = {
    chave: string;
    produto: StoreProduct;
    // Ausentes no card normal (produto inteiro, com as bolinhas de cor).
    cor?: string;
    foto?: string;
};

function fotoDaCor(produto: StoreProduct, cor: string): string | undefined {
    const mapa = produto.colorImages;
    if (!mapa || !cor) return undefined;
    const alvo = normalizeColorKey(cor);
    const chave = Object.keys(mapa).find((k) => normalizeColorKey(k) === alvo);
    return chave ? mapa[chave]?.[0] : undefined;
}

export function abrirCoresEmCards(produtos: StoreProduct[]): CardDeVitrine[] {
    const cards: CardDeVitrine[] = [];

    for (const produto of produtos) {
        // So cor COM ESTOQUE ganha card proprio. Uma cor esgotada virando card
        // e um anuncio de algo que a cliente nao pode comprar: ela clica, chega
        // na pagina e a estampa nem aparece na lista.
        const doProduto = produto.availableColors ?? produto.colors ?? [];
        const comFoto = doProduto.filter((cor) => fotoDaCor(produto, cor));

        // Com uma cor fotografada (ou nenhuma) nao ha o que abrir: abrir daria
        // o card de sempre, so que sem as bolinhas de cor — pior do que esta.
        if (comFoto.length < 2) {
            cards.push({ chave: produto.id, produto });
            continue;
        }

        // O produto inteiro abre a fila. E o unico card com as fotos do
        // ensaio — e portanto o unico que se mexe no hover, porque as cores
        // tem uma foto so cada. Sem ele, a vitrine inteira ficava parada.
        cards.push({ chave: produto.id, produto });

        for (const cor of comFoto) {
            cards.push({
                chave: `${produto.id}:${cor}`,
                produto,
                cor,
                foto: fotoDaCor(produto, cor),
            });
        }
    }

    return cards;
}

// Quais abas abrem por cor. Escolhidas uma a uma pela Chris, nao por regra
// automatica: e decisao de vitrine, e ela e quem decide o que fica na tela.
//
// O criterio tem sido a aba magra onde as cores estao fotografadas:
//   masculino  6 produtos -> 40 cards
//   blusas     8 produtos -> 41 cards
//   robe       1 produto  ->  5 cards
//   senhoras   1 produto  ->  5 cards
//   lingerie   1 produto  ->  3 cards
//   plus size 11 produtos -> 126 cards (leva junto as quatro sub-abas dela:
//              baby doll plus size, pijama curto, pijama longo e camisola)
//
// O feminino inteiro nao esta aqui de proposito: 78 produtos virariam 643
// cards, e isso pede paginacao antes — e outra conversa.
//
// Vale para a aba e para tudo abaixo dela (uma filha de Masculino tambem abre).
const CATEGORIAS_ABERTAS_POR_COR = [
    "masculino",
    "blusa",
    "robe",
    "lingerie",
    "senhoras",
    "plus size",
];

export function abrePorCor(
    categoria: CategoryRow | null,
    todas: CategoryRow[],
): boolean {
    let atual = categoria;
    const vistos = new Set<string>();

    while (atual && !vistos.has(atual.id)) {
        vistos.add(atual.id); // categoria mal cadastrada nao pode virar laco infinito
        const nome = normalizeColorKey(atual.name);
        if (CATEGORIAS_ABERTAS_POR_COR.some((alvo) => nome.includes(alvo))) return true;
        atual = todas.find((c) => c.id === atual?.parentId) ?? null;
    }

    return false;
}
