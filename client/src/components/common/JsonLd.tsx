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
