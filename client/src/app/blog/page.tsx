import type { Metadata } from "next";
import Link from "next/link";
import { listarArtigos, type PostResumo } from "../../services/blogService";
import { BlogHeader, BlogFooter } from "../../components/blog/BlogChrome";
import { CartaoEditorial, SeparadorComContagem } from "../../components/blog/Cartoes";
import { SalaDeArquivos } from "../../components/blog/SalaDeArquivos";
import { COR_DA_CATEGORIA } from "../../components/blog/categorias";

// Renderiza a cada visita: artigo novo aparece na hora, sem publicar de novo.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Blog",
    description:
        "Conteúdo exclusivo para revendedoras de pijamas: treinamento, histórias e dicas para vender mais.",
    alternates: { canonical: "https://feminnita.com.br/blog" },
};

export default async function BlogPage({
    searchParams,
}: {
    searchParams: Promise<{ categoria?: string }>;
}) {
    const { categoria } = await searchParams;
    const todos = await listarArtigos();
    const artigos = categoria ? todos.filter((a) => a.category === categoria) : todos;

    // Só mostra no filtro a categoria que tem artigo — botão que abre lista
    // vazia é armadilha.
    const comArtigo = Object.keys(COR_DA_CATEGORIA).filter((c) =>
        todos.some((a) => a.category === c),
    );

    return (
        <div className="min-h-screen bg-[#FAF6F2]">
            <BlogHeader />
            <Filtros ativa={categoria} categorias={comArtigo} />

            <SeparadorComContagem total={artigos.length} />

            {artigos.length === 0 ? (
                <p className="pb-20 text-center text-gray-400">Nenhum artigo publicado ainda.</p>
            ) : (
                // Mosaico de duas colunas com 2px de respiro, como no original:
                // as fotos quase se encostam e a página lê como revista.
                <div className="container mx-auto grid gap-[2px] px-4 pb-14 md:grid-cols-2">
                    {artigos.map((a: PostResumo) => (
                        <CartaoEditorial key={a.id} post={a} />
                    ))}
                </div>
            )}

            <SalaDeArquivos />
            <BlogFooter />
        </div>
    );
}

function Filtros({ ativa, categorias }: { ativa?: string; categorias: string[] }) {
    const itens = [{ nome: "Todos os artigos", href: "/blog", ativo: !ativa }].concat(
        categorias.map((c) => ({
            nome: c,
            href: `/blog?categoria=${encodeURIComponent(c)}`,
            ativo: ativa === c,
        })),
    );

    return (
        <div className="border-b border-black/5 bg-white">
            <div className="container mx-auto flex gap-1 overflow-x-auto px-4">
                {itens.map((i) => (
                    <Link
                        key={i.nome}
                        href={i.href}
                        className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-4 text-sm transition-colors ${
                            i.ativo
                                ? "border-[#8C2F39] font-semibold text-[#8C2F39]"
                                : "border-transparent text-gray-500 hover:text-[#8C2F39]"
                        }`}
                    >
                        {i.nome}
                    </Link>
                ))}
            </div>
        </div>
    );
}
