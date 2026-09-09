import Link from "next/link";
import type { PostResumo } from "../../services/blogService";
import { corDaCategoria } from "./categorias";

export const dataCurta = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "";

// Cartão editorial, igual ao do blog antigo: a FOTO sangra no cartão inteiro e
// o texto fica POR CIMA dela, sobre um degradê escuro. A foto cresce um pouco
// no hover.
//
// A versão que eu tinha feito antes era caixa branca com o texto embaixo — que
// é exatamente como a loja mostra produto. Daí a sensação de "página de
// produto". A diferença está aqui.
export function CartaoEditorial({ post }: { post: PostResumo }) {
    const cor = corDaCategoria(post.category);

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group relative block overflow-hidden bg-[#111]"
            style={{ aspectRatio: "16 / 10" }}
        >
            {post.coverUrl ? (
                <img
                    src={post.coverUrl}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
            ) : (
                // Sem capa, um fundo na cor da categoria em vez de retângulo
                // preto: continua legível e parece escolha, não falta.
                <div
                    className="h-full w-full"
                    style={{ background: `linear-gradient(140deg, ${cor} 0%, #1A1A1A 85%)` }}
                />
            )}

            {/* Degradê que garante leitura do texto sobre qualquer foto. */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(to top, rgba(5,2,3,0.93) 0%, rgba(5,2,3,0.72) 32%, rgba(5,2,3,0.18) 68%, rgba(5,2,3,0) 100%)",
                }}
            />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                {post.category && (
                    <span
                        className="mb-3 inline-block rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ background: cor }}
                    >
                        {post.category}
                    </span>
                )}

                <h3 className="mb-2 font-serif text-2xl leading-tight text-white sm:text-[1.7rem]">
                    {post.title}
                </h3>

                {post.excerpt && (
                    <p className="mb-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75">
                        {post.excerpt}
                    </p>
                )}

                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/55">
                    <span>{dataCurta(post.publishedAt)}</span>
                    <span>·</span>
                    <span>{post.authorName || "Feminnita"}</span>
                    <span>·</span>
                    <span>5 min</span>
                </div>
            </div>
        </Link>
    );
}

// Linhas de gramatura fina com a contagem no meio, como no original. Serve de
// respiro entre o filtro e o mosaico.
export function SeparadorComContagem({ total }: { total: number }) {
    return (
        <div className="container mx-auto flex items-center px-4 py-8">
            <span className="h-px flex-1" style={{ background: "rgba(212,169,86,0.25)" }} />
            <span className="px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-400">
                {total} {total === 1 ? "artigo" : "artigos"}
            </span>
            <span className="h-px flex-1" style={{ background: "rgba(212,169,86,0.25)" }} />
        </div>
    );
}
