import type { MetadataRoute } from "next";
import { fetchProducts } from "../services/productsService";
import { fetchCategories } from "../services/categoriesService";
import { listarArtigos } from "../services/blogService";
import { BLOG_NO_AR } from "../lib/blog";

// Mesma fonte de verdade do canonical, do og:url e do feed: NEXT_PUBLIC_SITE_URL.
//
// Estava escrito a mao como "https://feminnita.com.br", enquanto o canonical
// saia de NEXT_PUBLIC_SITE_URL. Duas respostas para a mesma pergunta: o
// sitemap entregava ao Google uma lista de enderecos sem www, e o canonical de
// cada pagina apontava para outro lugar. Na virada do dominio, o principal e o
// WWW — entao cada endereco do sitemap seria um redirecionamento, e o Google
// leria o mapa inteiro como desatualizado.
const SITE =
    process.env.NEXT_PUBLIC_SITE_URL || "https://site-feminnita-alpha.vercel.app";

// A loja nao tinha sitemap: o Google precisava descobrir cada produto seguindo
// link por link, e produto novo demorava a ser encontrado. Aqui ele recebe a
// lista pronta.
//
// A URL do produto e /produto/{slug}-{codigo}, o mesmo formato que a loja usa.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const fixas: MetadataRoute.Sitemap = [
        { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
        { url: `${SITE}/produtos`, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE}/lancamentos`, changeFrequency: "daily", priority: 0.8 },
        { url: `${SITE}/mais-vendidos`, changeFrequency: "daily", priority: 0.8 },
        { url: `${SITE}/outlet`, changeFrequency: "daily", priority: 0.8 },
        { url: `${SITE}/como-comprar`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITE}/envio-e-entrega`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITE}/trocas-e-devolucoes`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITE}/central-de-ajuda`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITE}/politica-de-privacidade`, changeFrequency: "yearly", priority: 0.3 },
    ];

    // Se a API falhar, entrega ao menos as paginas fixas em vez de derrubar o
    // sitemap inteiro — um sitemap incompleto vale mais que nenhum.
    const [produtos, categorias, artigos] = await Promise.all([
        fetchProducts({ limit: 1000 }).catch(() => []),
        fetchCategories().catch(() => []),
        listarArtigos().catch(() => []),
    ]);

    // Blog desligado nao entra no sitemap: oferecer ao Google uma pagina que
    // responde "em construcao" e pedir para ele indexar um buraco.
    const doBlog: MetadataRoute.Sitemap = BLOG_NO_AR
        ? [
              { url: `${SITE}/blog`, changeFrequency: "weekly" as const, priority: 0.7 },
              ...artigos.map((a) => ({
                  url: `${SITE}/blog/${a.slug}`,
                  changeFrequency: "monthly" as const,
                  priority: 0.6,
              })),
          ]
        : [];

    const deCategoria: MetadataRoute.Sitemap = (categorias as { slug?: string }[])
        .filter((c) => c.slug)
        .map((c) => ({
            url: `${SITE}/categoria/${c.slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

    // A URL do produto e SO o slug — e a mesma que os cards da loja usam
    // (ProductCard: /produto/{slug}). Juntar o codigo aqui gerava 404 no sitemap
    // inteiro: um sitemap cheio de link quebrado e pior que nao ter sitemap,
    // porque ensina o Google que o site tem paginas mortas.
    const deProduto: MetadataRoute.Sitemap = (produtos as { slug?: string }[])
        .filter((p) => p.slug)
        .map((p) => ({
            url: `${SITE}/produto/${p.slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

    return [...fixas, ...deCategoria, ...doBlog, ...deProduto];
}
