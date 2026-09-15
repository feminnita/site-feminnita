import type { Metadata } from "next";

// A pagina de produtos e "use client" (tem filtro, busca e ordenacao no estado),
// e componente client nao pode exportar metadata. Por isso o title dela mora
// aqui, no layout do segmento.
//
// Sem isto, /produtos se apresentava ao Google com o MESMO title da home
// ("Feminnita | Pijamas e Moda Intima no Atacado"). Duas paginas com o mesmo
// title disputam a mesma busca e o Google escolhe uma — normalmente nao a que a
// gente queria para "pijama atacado".
export const metadata: Metadata = {
    title: "Todos os Produtos",
    description:
        "Toda a coleção Feminnita: pijamas, camisolas, short doll e moda íntima no atacado. Direto da fábrica, pedido mínimo R$ 199.",
    alternates: { canonical: "/produtos" },
    openGraph: {
        title: "Todos os Produtos | Feminnita",
        description:
            "Toda a coleção Feminnita no atacado: pijamas, camisolas e short doll direto da fábrica.",
        // images precisa ser repetido aqui: quando um segmento declara openGraph,
        // o Next NAO herda os campos que faltam do layout pai — ele troca o objeto
        // inteiro. Sem esta linha, /produtos volta a ser compartilhada sem imagem.
        images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
};

export default function ProdutosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
