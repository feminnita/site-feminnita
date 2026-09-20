import type { MetadataRoute } from "next";

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

// A loja nao tinha robots.txt: o Google entrava sem nenhuma orientacao e sem
// saber onde fica o mapa do site.
//
// O que fica de fora e o que nao serve para busca — area logada, carrinho,
// checkout e as telas de conta. Bloquear isso nao esconde nada de valor; evita
// que o Google gaste o tempo dele em pagina que ninguem procura no Google.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/checkout",
                "/carrinho",
                "/minha-conta",
                "/pedido-confirmado",
                "/login",
                "/cadastro",
                "/esqueci-senha",
                "/redefinir-senha",
                "/favoritos",
                "/busca",
            ],
        },
        sitemap: `${SITE}/sitemap.xml`,
    };
}
