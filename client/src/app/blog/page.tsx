import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/layout/Header";
import { listarArtigos } from "../../services/blogService";

// Renderiza a cada visita: artigo novo aparece na hora, sem publicar de novo.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Blog | Feminnita",
    description:
        "Conteúdo para quem revende pijamas: como precificar, como fotografar, como vender no WhatsApp e no Instagram.",
    alternates: { canonical: "https://feminnita.com.br/blog" },
};

const data = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";

export default async function BlogPage() {
    const artigos = await listarArtigos();

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="container mx-auto px-4 py-12">
                <header className="mx-auto mb-12 max-w-2xl text-center">
                    <h1 className="mb-3 text-4xl font-light">Blog da Feminnita</h1>
                    <p className="leading-relaxed text-gray-600">
                        Quem compra para revender quase sempre aprende sozinha. Aqui não: o que
                        funciona, o que não funciona, e por quê.
                    </p>
                </header>

                {artigos.length === 0 ? (
                    <p className="py-16 text-center text-gray-400">
                        Nenhum artigo publicado ainda.
                    </p>
                ) : (
                    <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {artigos.map((a) => (
                            <Link
                                key={a.id}
                                href={`/blog/${a.slug}`}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 transition-shadow hover:shadow-lg"
                            >
                                {/* Sem capa a imagem some, em vez de deixar um quadrado cinza:
                                    quase nenhum artigo importado veio com foto. */}
                                {a.coverUrl && (
                                    <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                                        <img
                                            src={a.coverUrl}
                                            alt=""
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                )}

                                <div className="flex flex-1 flex-col p-5">
                                    <h2 className="mb-2 text-lg font-medium leading-snug text-gray-900 transition-colors group-hover:text-[#8C2F39]">
                                        {a.title}
                                    </h2>
                                    {a.excerpt && (
                                        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
                                            {a.excerpt}
                                        </p>
                                    )}
                                    <span className="mt-auto text-xs text-gray-400">
                                        {data(a.publishedAt)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
