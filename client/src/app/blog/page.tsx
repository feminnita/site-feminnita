import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/layout/Header";
import { listarArtigos, type PostResumo } from "../../services/blogService";
import { BlogNav } from "../../components/blog/BlogNav";
import { Destaque, Linha, Aberto, Selo, dataCurta } from "../../components/blog/Cartoes";
import { COR_DA_CATEGORIA, corDaCategoria } from "../../components/blog/categorias";

// Renderiza a cada visita: artigo novo aparece na hora, sem publicar de novo.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Blog",
    description:
        "Conteúdo para quem revende pijamas: como precificar, como fotografar, como vender no WhatsApp e no Instagram.",
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

    return (
        <div className="min-h-screen bg-[#FAF6F2]">
            <Header />
            <BlogNav ativa={categoria} />

            {categoria ? (
                <Categoria nome={categoria} artigos={artigos} />
            ) : (
                <Capa artigos={todos} />
            )}
        </div>
    );
}

// A capa do blog: abertura, depois uma seção por assunto. Cada seção tem um
// artigo aberto e o resto em lista — é a variação de ritmo que faz parecer
// site, e não vitrine com cartões todos do mesmo tamanho.
function Capa({ artigos }: { artigos: PostResumo[] }) {
    if (!artigos.length) {
        return <p className="py-24 text-center text-gray-400">Nenhum artigo publicado ainda.</p>;
    }

    const [destaque, ...resto] = artigos;

    // Mantém a ordem das categorias fixa, para a página não trocar de layout a
    // cada artigo novo publicado.
    const secoes = Object.keys(COR_DA_CATEGORIA)
        .map((nome) => ({ nome, itens: resto.filter((a) => a.category === nome) }))
        .filter((s) => s.itens.length);

    const semCategoria = resto.filter((a) => !a.category || !(a.category in COR_DA_CATEGORIA));

    return (
        <>
            <section className="container mx-auto px-4 pb-12 pt-10">
                <p className="mb-8 max-w-2xl font-serif text-2xl leading-snug text-[#8C2F39] md:text-3xl">
                    Quem revende não precisa aprender sozinha.
                </p>
                <Destaque post={destaque} />
            </section>

            <div className="border-t border-[#8C2F39]/10">
                <div className="container mx-auto grid gap-12 px-4 py-12 lg:grid-cols-[1fr_300px]">
                    <div className="space-y-14">
                        {secoes.map((s) => (
                            <Secao key={s.nome} nome={s.nome} itens={s.itens} />
                        ))}
                        {semCategoria.length > 0 && (
                            <Secao nome="Outros textos" itens={semCategoria} />
                        )}
                    </div>

                    <Lateral artigos={artigos} />
                </div>
            </div>
        </>
    );
}

function Secao({ nome, itens }: { nome: string; itens: PostResumo[] }) {
    const cor = corDaCategoria(nome);
    const [primeiro, ...outros] = itens;

    return (
        <section>
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b-2 pb-2" style={{ borderColor: cor }}>
                <h2 className="font-serif text-2xl text-[#1A1A1A]">{nome}</h2>
                {itens.length > 2 && (
                    <Link
                        href={`/blog?categoria=${encodeURIComponent(nome)}`}
                        className="shrink-0 text-xs uppercase tracking-wider hover:underline"
                        style={{ color: cor }}
                    >
                        Ver todos ({itens.length})
                    </Link>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
                <Aberto post={primeiro} />
                {outros.length > 0 && (
                    <div className="flex flex-col">
                        {outros.slice(0, 4).map((a) => (
                            <Linha key={a.id} post={a} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function Lateral({ artigos }: { artigos: PostResumo[] }) {
    const porCategoria = Object.keys(COR_DA_CATEGORIA)
        .map((nome) => ({ nome, n: artigos.filter((a) => a.category === nome).length }))
        .filter((c) => c.n);

    return (
        <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-sm border border-[#8C2F39]/12 bg-white p-5">
                <h3 className="mb-4 font-serif text-lg text-[#1A1A1A]">Assuntos</h3>
                <ul className="space-y-2">
                    {porCategoria.map((c) => (
                        <li key={c.nome}>
                            <Link
                                href={`/blog?categoria=${encodeURIComponent(c.nome)}`}
                                className="flex items-center justify-between gap-2 text-sm text-gray-600 transition-colors hover:text-[#8C2F39]"
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: corDaCategoria(c.nome) }}
                                    />
                                    {c.nome}
                                </span>
                                <span className="text-xs text-gray-400">{c.n}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="rounded-sm bg-[#8C2F39] p-5 text-white">
                <h3 className="mb-2 font-serif text-lg">Revende Feminnita?</h3>
                <p className="mb-4 text-sm leading-relaxed text-white/85">
                    Pijamas no atacado a partir de R$ 199, direto de Nova Friburgo.
                </p>
                <Link
                    href="/produtos"
                    className="inline-block rounded-sm bg-white px-4 py-2 text-sm font-semibold text-[#8C2F39] transition-opacity hover:opacity-90"
                >
                    Ver o catálogo
                </Link>
            </div>
        </aside>
    );
}

// Uma categoria sozinha: lista corrida, sem seções. Quem clicou já sabe o que
// quer ler.
function Categoria({ nome, artigos }: { nome: string; artigos: PostResumo[] }) {
    const cor = corDaCategoria(nome);

    return (
        <div className="container mx-auto grid gap-12 px-4 py-12 lg:grid-cols-[1fr_300px]">
            <div>
                <div className="mb-8 border-b-2 pb-3" style={{ borderColor: cor }}>
                    <Selo categoria={nome} />
                    <h1 className="mt-3 font-serif text-3xl text-[#1A1A1A]">{nome}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {artigos.length} {artigos.length === 1 ? "artigo" : "artigos"}
                    </p>
                </div>

                {artigos.length === 0 ? (
                    <p className="py-12 text-center text-gray-400">Nada publicado nesse assunto ainda.</p>
                ) : (
                    <div>
                        {artigos.map((a) => (
                            <Linha key={a.id} post={a} />
                        ))}
                    </div>
                )}

                <p className="mt-8 text-xs uppercase tracking-wider text-gray-400">
                    Atualizado em {dataCurta(artigos[0]?.publishedAt ?? null)}
                </p>
            </div>

            <Lateral artigos={artigos} />
        </div>
    );
}
