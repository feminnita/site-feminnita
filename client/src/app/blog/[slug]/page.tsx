import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/layout/Header";
import { JsonLd } from "../../../components/common/JsonLd";
import { buscarArtigo } from "../../../services/blogService";
import { corDaCategoria } from "../../../components/blog/categorias";

export const dynamic = "force-dynamic";

const SITE = "https://feminnita.com.br";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const artigo = await buscarArtigo(slug);
    if (!artigo) return { title: "Artigo não encontrado" };

    const descricao = (artigo.excerpt || "").slice(0, 155);
    return {
        title: artigo.title,
        description: descricao,
        alternates: { canonical: `${SITE}/blog/${artigo.slug}` },
        openGraph: {
            title: artigo.title,
            description: descricao,
            type: "article",
            ...(artigo.coverUrl ? { images: [artigo.coverUrl] } : {}),
        },
    };
}

const data = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";

export default async function ArtigoPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const artigo = await buscarArtigo(slug);
    if (!artigo) notFound();

    return (
        <div className="min-h-screen bg-[#FAF6F2]">
            <Header />

            {/* Dados estruturados no servidor, para o Google receber junto com o
                HTML — mesma lição da página de produto, onde eles eram montados no
                cliente e nunca chegavam. */}
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: artigo.title,
                    description: artigo.excerpt || undefined,
                    image: artigo.coverUrl ? [`${SITE}${artigo.coverUrl}`] : undefined,
                    datePublished: artigo.publishedAt || undefined,
                    author: { "@type": "Organization", name: artigo.authorName || "Feminnita" },
                    publisher: { "@type": "Organization", name: "Feminnita" },
                    mainEntityOfPage: `${SITE}/blog/${artigo.slug}`,
                }}
            />

            <article className="container mx-auto px-4 py-12">
                <div className="mx-auto max-w-3xl rounded-2xl bg-white p-7 shadow-[0_2px_16px_rgba(140,47,57,0.08)] md:p-12">
                    <Link
                        href="/blog"
                        className="mb-8 inline-block text-sm text-gray-500 transition-colors hover:text-[#8C2F39]"
                    >
                        ← Voltar para o blog
                    </Link>

                    {artigo.category && (
                        <span
                            className="mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{
                                backgroundColor: `${corDaCategoria(artigo.category)}1a`,
                                color: corDaCategoria(artigo.category),
                            }}
                        >
                            {artigo.category}
                        </span>
                    )}

                    <h1 className="mb-3 font-serif text-3xl leading-tight text-[#1A1A1A] md:text-4xl">
                        {artigo.title}
                    </h1>
                    <p className="mb-8 text-sm text-gray-400">
                        {artigo.authorName || "Feminnita"} · {data(artigo.publishedAt)}
                    </p>

                    {artigo.coverUrl && (
                        <div className="mb-10 overflow-hidden rounded-2xl">
                            <img src={artigo.coverUrl} alt="" className="w-full object-cover" />
                        </div>
                    )}

                    {/* O conteúdo veio do blog antigo já em HTML. `artigo-conteudo`
                        dá a ele tipografia de leitura sem depender de plugin. */}
                    <div
                        className="artigo-conteudo"
                        dangerouslySetInnerHTML={{ __html: artigo.body }}
                    />

                    <div className="mt-14 rounded-2xl bg-[#FAF6F2] p-8 text-center">
                        <p className="mb-2 text-lg font-medium text-gray-900">
                            Quer comprar para revender?
                        </p>
                        <p className="mb-5 text-sm text-gray-600">
                            Direto da fábrica, a partir de R$ 199 no atacado.
                        </p>
                        <Link
                            href="/produtos"
                            className="inline-block rounded-xl bg-[#8C2F39] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7a2832]"
                        >
                            Ver produtos
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
}
