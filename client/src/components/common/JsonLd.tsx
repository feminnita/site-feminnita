type Props = { data: Record<string, unknown> };

export function JsonLd({ data }: Props) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

export function productSchema(product: {
    id: string;
    name: string;
    description?: string;
    images: string[];
    pixPrice: number;
    price: number;
    sizes: string[];
    inStock?: boolean;
}) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description:
            product.description || `${product.name} — Moda Fitness Feminnita`,
        image: product.images,
        sku: product.id,
        brand: { "@type": "Brand", name: "Feminnita" },
        offers: {
            "@type": "AggregateOffer",
            priceCurrency: "BRL",
            lowPrice: product.pixPrice,
            highPrice: product.price,
            offerCount: product.sizes.length,
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
