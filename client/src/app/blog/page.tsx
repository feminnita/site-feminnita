import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/layout/Header";
import { listarArtigos } from "../../services/blogService";
import { corDaCategoria } from "../../components/blog/categorias";

// Renderiza a cada visita: artigo novo aparece na hora, sem publicar de novo.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Blog",
    description:
        "Conteúdo para quem revende pijamas: como precificar, como fotografar, como vender no WhatsApp e no Instagram.",
    alternates: { canonical: "https://feminnita.com.br/blog" },
};

const data = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "";

export default async function BlogPage() {
    const artigos = await listarArtigos();
    const [destaque, ...restantes] = artigos;

    return (
        <div className="min-h-screen bg-[#FAF6F2]">
            <Header />

            {/* Abertura editorial, com a serifada do blog antigo. É ela que tira a
                cara de lista de links e dá cara de revista. */}
            <section className="border-b border-[#8C2F39]/10 bg-white">
                <div className="container mx-auto px-4 py-16 text-center">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#D4A956]">
                        Blog da Feminnita
                    </p>
                    <h1 className="mx-auto mb-4 max-w-2xl font-serif text-4xl leading-tight text-[#1A1A1A] md:text-5xl">
                        Quem revende não precisa aprender sozinha
                    </h1>
                    <p className="mx-auto max-w-xl leading-relaxed text-gray-600">
                        Precificação, fotos, Instagram, WhatsApp e tecido. O que funciona, o que
                        não funciona, e por quê.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-14">
                {artigos.length === 0 ? (
                    <p className="py-16 text-center text-gray-400">Nenhum artigo publicado ainda.</p>
                ) : (
                    <>
                        {/* Um artigo em destaque, largo. Sem capa nenhum artigo se
                            sobressai — o destaque cria a hierarquia que faltava. */}
                        {destaque && (
                            <Link
                                href={`/blog/${destaque.slug}`}
                                className="group mx-auto mb-14 block max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(140,47,57,0.08)] transition-shadow hover:shadow-[0_6px_28px_rgba(140,47,57,0.16)]"
                            >
                                <div className="grid md:grid-cols-2">
                                    <div
                                        className="min-h-[220px] bg-cover bg-center"
                                        style={{
                                            backgroundColor: `${corDaCategoria(destaque.category)}14`,
                                            backgroundImage: destaque.coverUrl
                                                ? `url(${destaque.coverUrl})`
                                                : undefined,
                                        }}
                                    >
                                        {!destaque.coverUrl && (
                                            <div className="flex h-full items-center justify-center p-10">
                                                <span
                                                    className="font-serif text-6xl leading-none opacity-25"
                                                    style={{ color: corDaCategoria(destaque.category) }}
                                                >
                                                    {destaque.title.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col justify-center p-8 md:p-10">
                                        <Selo categoria={destaque.category} />
                                        <h2 className="mb-3 font-serif text-2xl leading-snug text-[#1A1A1A] transition-colors group-hover:text-[#8C2F39] md:text-3xl">
                                            {destaque.title}
                                        </h2>
                                        {destaque.excerpt && (
                                            <p className="mb-5 line-clamp-3 leading-relaxed text-gray-600">
                                                {destaque.excerpt}
                                            </p>
                                        )}
                                        <span className="text-xs uppercase tracking-wider text-gray-400">
                                            {data(destaque.publishedAt)} · leitura de 5 min
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}

                        <div className="mx-auto grid max-w-6xl gap-7 sm:grid-cols-2 lg:grid-cols-3">
                            {restantes.map((a) => (
                                <Link
                                    key={a.id}
                                    href={`/blog/${a.slug}`}
                                    className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(140,47,57,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_6px_28px_rgba(140,47,57,0.16)]"
                                >
                                    {/* Sem capa, uma faixa na cor da categoria com a
                                        inicial do título: dá identidade ao card em vez
                                        de deixar um bloco branco. */}
                                    <div
                                        className="flex h-36 items-center justify-center bg-cover bg-center"
                                        style={{
                                            backgroundColor: `${corDaCategoria(a.category)}14`,
                                            backgroundImage: a.coverUrl ? `url(${a.coverUrl})` : undefined,
                                        }}
                                    >
                                        {!a.coverUrl && (
                                            <span
                                                className="font-serif text-5xl leading-none opacity-25"
                                                style={{ color: corDaCategoria(a.category) }}
                                            >
                                                {a.title.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <Selo categoria={a.category} />
                                        <h2 className="mb-2 font-serif text-xl leading-snug text-[#1A1A1A] transition-colors group-hover:text-[#8C2F39]">
                                            {a.title}
                                        </h2>
                                        {a.excerpt && (
                                            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
                                                {a.excerpt}
                                            </p>
                                        )}
                                        <span className="mt-auto text-xs uppercase tracking-wider text-gray-400">
                                            {data(a.publishedAt)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Selo({ categoria }: { categoria: string | null }) {
    if (!categoria) return null;
    const cor = corDaCategoria(categoria);
    return (
        <span
            className="mb-3 inline-block self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${cor}1a`, color: cor }}
        >
            {categoria}
        </span>
    );
}
