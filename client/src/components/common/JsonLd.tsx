import { effectivePrice } from "../../utils/pricing";

type Props = { data: Record<string, unknown> };

export function JsonLd({ data }: Props) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

/**
 * O que o Google le da pagina para montar o catalogo do Shopping.
 *
 * O Merchant Center desta loja NAO e alimentado por arquivo: o Google entra no
 * site, le este bloco e monta o produto sozinho. Entao o que esta aqui precisa
 * bater, ao centavo, com o que a cliente ve na tela — preco divergente entre a
 * pagina e o dado estruturado e uma das causas classicas de reprovacao.
 *
 * Tres coisas estavam erradas:
 *
 * 1. O PRECO ignorava a promocao. Declarava um intervalo entre o preco no PIX e
 *    o preco cheio (56,99 a 59,99) enquanto a pagina vendia por 31,99. Agora sai
 *    de effectivePrice(), a MESMA funcao que a tela usa — sem segunda fonte de
 *    verdade, que foi exatamente o erro que deixou o sitemap fora de sincronia.
 *
 * 2. O sku era o id interno do banco (um UUID). O feed.xml manda o CODIGO
 *    (24400) em g:id, e o Pixel da Meta manda o codigo em content_ids. Tres
 *    nomes para a mesma peca: o Google nao casava o produto lido da pagina com
 *    o produto do feed, e o remarketing dinamico nao encontrava o anuncio.
 *
 * 3. A descricao de reserva dizia "Moda Fitness" — a loja vende moda de dormir.
 */
export function productSchema(product: {
    id: string;
    code?: string | number | null;
    name: string;
    description?: string;
    images: string[];
    price: number;
    salePrice?: number | null;
    saleStart?: string | null;
    saleEnd?: string | null;
    sizes: string[];
    inStock?: boolean;
}) {
    const preco = effectivePrice(
        product.price,
        product.salePrice,
        product.saleStart,
        product.saleEnd,
    );

    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description:
            product.description ||
            `${product.name} — pijamas e moda de dormir Feminnita`,
        image: product.images,
        sku: String(product.code ?? product.id),
        brand: { "@type": "Brand", name: "Feminnita" },
        offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: preco.toFixed(2),
            itemCondition: "https://schema.org/NewCondition",
            availability:
                product.inStock === false
                    ? "https://schema.org/OutOfStock"
                    : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: "Feminnita" },
        },
    };
}

/**
 * Quem e a Feminnita, para o Google.
 *
 * A pagina de produto ja se identificava (productSchema), mas a marca nao. Sem
 * isto o Google monta o painel de marca no chute — e o "Feminnita" que ele
 * conhece continua sendo o site antigo do Wix. Os perfis em sameAs sao o que
 * liga o site aos canais oficiais e evita a loja ser confundida com revendedora.
 *
 * base = a URL publica do site (metadataBase). Passada de fora porque aqui nao
 * da pra ler env de forma confiavel nos dois runtimes.
 */
export function organizationSchema(base: string) {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Feminnita",
        url: base,
        logo: `${base}/favicon-512.png`,
        description:
            "Pijamas e moda íntima feminina no atacado, direto da fábrica. Pedido mínimo R$ 199.",
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+5522992810707",
            contactType: "sales",
            areaServed: "BR",
            availableLanguage: "Portuguese",
        },
        sameAs: [
            "https://www.instagram.com/feminnita/",
            "https://www.facebook.com/feminnita/",
        ],
    };
}

/**
 * O site em si. Declara a busca interna para o Google poder oferecer a caixinha
 * de busca da Feminnita direto no resultado, em vez de so listar links.
 */
export function webSiteSchema(base: string) {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Feminnita",
        url: base,
        inLanguage: "pt-BR",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${base}/produtos?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: item.url,
        })),
    };
}
