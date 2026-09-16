import { fetchProducts } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";

/**
 * Feed de produtos para o Google Merchant Center e para o catalogo da Meta
 * (Instagram/Facebook).
 *
 * Por que existe: sem feed, a loja nao aparece no Google Shopping, nao tem
 * catalogo no Instagram e nao roda remarketing dinamico — aquele anuncio que
 * mostra pra pessoa o exato pijama que ela olhou. O Meta Pixel ja esta instalado
 * e mandando ViewContent/AddToCart com content_ids; sem um catalogo do outro
 * lado para casar esses ids, esses eventos nao viram anuncio de produto.
 *
 * Formato: RSS 2.0 com o namespace g: do Google. A Meta le o MESMO arquivo, entao
 * um feed serve os dois — nao precisa de um segundo endereco.
 *
 * URL: /feed.xml
 */

// O feed nao pode ser gerado a cada acesso: o Google busca varias vezes por dia e
// a Meta tambem. 1h de cache mantem preco e disponibilidade frescos sem martelar
// a API da loja.
export const revalidate = 3600;

const SITE =
    process.env.NEXT_PUBLIC_SITE_URL || "https://site-feminnita-alpha.vercel.app";

/** XML quebra em & < > " '. Um caractere solto invalida o feed INTEIRO. */
function esc(valor: string): string {
    return valor
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * A descricao vem do painel e pode ter HTML. O Google aceita texto puro; tag
 * solta no meio vira lixo na ficha do anuncio.
 */
function textoLimpo(html: string, limite: number): string {
    const texto = String(html ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

/** "39.9" -> "39.90 BRL". O Google exige 2 casas e a moeda junto. */
function preco(valor: number): string {
    return `${valor.toFixed(2)} BRL`;
}

function item(p: StoreProduct): string {
    const url = `${SITE}/produto/${p.slug || p.id}`;
    const capa = p.images?.[0];

    // Promocao so entra como sale_price se for REALMENTE menor que o cheio —
    // senao o Google reprova o item por "preco de promocao invalido".
    const temPromo =
        typeof p.salePrice === "number" && p.salePrice > 0 && p.salePrice < p.price;

    const linhas: string[] = [
        `<g:id>${esc(p.code || p.id)}</g:id>`,
        // title tem limite de 150 no Google; cortar aqui evita reprovacao silenciosa.
        `<title>${esc(textoLimpo(p.name, 150))}</title>`,
        `<description>${esc(textoLimpo(p.description || p.name, 5000))}</description>`,
        `<link>${esc(url)}</link>`,
        `<g:condition>new</g:condition>`,
        `<g:brand>Feminnita</g:brand>`,
        // Sem codigo de barras global: dizer isso explicitamente evita o aviso de
        // "identificador faltando" em todo o catalogo.
        `<g:identifier_exists>no</g:identifier_exists>`,
        `<g:price>${preco(p.price)}</g:price>`,
        `<g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>`,
    ];

    if (capa) linhas.push(`<g:image_link>${esc(capa)}</g:image_link>`);
    // O Google aceita ate 10 imagens extras por item.
    for (const extra of (p.images || []).slice(1, 11)) {
        linhas.push(`<g:additional_image_link>${esc(extra)}</g:additional_image_link>`);
    }
    if (temPromo) linhas.push(`<g:sale_price>${preco(p.salePrice as number)}</g:sale_price>`);
    if (p.category) linhas.push(`<g:product_type>${esc(p.category)}</g:product_type>`);

    return `    <item>\n      ${linhas.join("\n      ")}\n    </item>`;
}

export async function GET() {
    // Se a API cair, devolve um feed VAZIO e valido em vez de erro. Feed quebrado
    // faz o Merchant Center suspender a conta; feed vazio so nao atualiza nada.
    const produtos = await fetchProducts({ limit: 1000 }).catch(
        () => [] as StoreProduct[],
    );

    // Produto inativo ou sem foto e reprovado na hora pelo Google — melhor nem
    // mandar do que colecionar erro no painel do Merchant.
    const vendaveis = produtos.filter(
        (p) => p.active !== false && p.images?.length > 0 && p.price > 0,
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Feminnita — Pijamas e Moda Íntima no Atacado</title>
    <link>${esc(SITE)}</link>
    <description>Catálogo Feminnita: pijamas, camisolas e moda íntima no atacado, direto da fábrica.</description>
${vendaveis.map(item).join("\n")}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
    });
}
