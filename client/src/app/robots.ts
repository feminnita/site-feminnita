import type { MetadataRoute } from "next";

const SITE = "https://feminnita.com.br";

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
