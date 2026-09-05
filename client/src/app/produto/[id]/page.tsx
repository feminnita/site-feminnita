import type { Metadata } from "next";
import { fetchProduct } from "@/src/services/productsService";
import ProductPageClient from "./ProductPageClient";

const SITE_NAME = "Feminnita";
const TITLE_SUFFIX = ` | ${SITE_NAME}`;
const TITLE_MAX = 60;
const DESC_MAX = 155;

// Corta um texto num limite de caracteres SEM quebrar palavra: recua até o último
// espaço e limpa pontuação solta na ponta. `ellipsis` só é aplicado quando de fato
// houve corte (texto maior que o limite).
function truncateAtWord(text: string, max: number, ellipsis: boolean): string {
    const t = text.trim();
    if (t.length <= max) return t;
    const slice = t.slice(0, max);
    const lastSpace = slice.lastIndexOf(" ");
    const base = (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).replace(
        /[\s.,;:!?\-–—]+$/,
        "",
    );
    return ellipsis ? `${base}…` : base;
}

// Descrição é HTML longo (parágrafos, <h3>, <ul>, tabela de medidas, frete). Para o
// fallback de SEO pegamos só o PRIMEIRO BLOCO DE TEXTO REAL: quebramos por tags de
// bloco, tiramos as tags, normalizamos espaços e escolhemos o primeiro trecho com
// conteúdo de verdade (>= 40 chars) — ignorando heading curto, item de lista e célula.
function firstMeaningfulParagraph(html: string): string {
    const blocks = html
        .replace(
            /<\s*(br|\/p|\/div|\/h[1-6]|\/li|\/tr|\/td|\/th|\/table|\/ul|\/ol)\s*\/?>/gi,
            "\n",
        )
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .split("\n")
        .map((b) => b.replace(/\s+/g, " ").trim())
        .filter((b) => b.length > 0);

    return blocks.find((b) => b.length >= 40) ?? blocks[0] ?? "";
}

// SEO por produto COM FALLBACK: se a dona deixar meta_title/meta_description em
// branco no cadastro, usamos o nome e a descrição do produto. Assim nenhum produto
// herda o título genérico do layout raiz — cada um tem SEO próprio.
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const product = await fetchProduct(id);

    if (!product) {
        return { title: "Produto não encontrado" };
    }

    // TÍTULO: meta_title preenchido é usado como está. Senão, nome do produto cortado
    // em palavra inteira reservando o espaço do sufixo " | Feminnita" (~60 chars).
    // `absolute` evita que o template do layout raiz duplique o sufixo.
    const titleAbsolute = product.metaTitle
        ? product.metaTitle
        : `${truncateAtWord(product.name, TITLE_MAX - TITLE_SUFFIX.length, false)}${TITLE_SUFFIX}`;

    // DESCRIÇÃO: meta_description preenchida, senão o 1º parágrafo real da descrição,
    // cortado em palavra inteira (~155). Só cai no texto de marca se não houver nada.
    const descSource =
        product.metaDescription ||
        firstMeaningfulParagraph(product.description || "");
    const description = descSource
        ? truncateAtWord(descSource, DESC_MAX, true)
        : `${product.name} — Feminnita: pijamas e moda íntima no atacado, direto da fábrica.`;

    // og:image / twitter:image = FOTO DE CAPA do produto (aparece ao compartilhar o
    // link no WhatsApp). Sem foto de capa, OMITE — nunca cai pro logo da loja.
    const image = product.images?.[0];
    const canonical = `/produto/${product.slug || product.id}`;

    return {
        title: { absolute: titleAbsolute },
        description,
        alternates: { canonical },
        openGraph: {
            title: titleAbsolute,
            description,
            url: canonical,
            type: "website",
            locale: "pt_BR",
            siteName: SITE_NAME,
            ...(image ? { images: [image] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: titleAbsolute,
            description,
            ...(image ? { images: [image] } : {}),
        },
    };
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ProductPageClient id={id} />;
}
