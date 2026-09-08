import Link from "next/link";
import type { PostResumo } from "../../services/blogService";
import { corDaCategoria } from "./categorias";

export const dataCurta = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "";

// Sem capa, uma faixa na cor da categoria com a inicial. Dá identidade sem foto.
function Faixa({ post, className }: { post: PostResumo; className?: string }) {
    const cor = corDaCategoria(post.category);
    return (
        <div
            className={`flex items-center justify-center bg-cover bg-center ${className ?? ""}`}
            style={{
                backgroundColor: `${cor}14`,
                backgroundImage: post.coverUrl ? `url(${post.coverUrl})` : undefined,
            }}
        >
            {!post.coverUrl && (
                <span className="font-serif leading-none opacity-25" style={{ color: cor, fontSize: "2.5em" }}>
                    {post.title.charAt(0)}
                </span>
            )}
        </div>
    );
}

export function Selo({ categoria }: { categoria: string | null }) {
    if (!categoria) return null;
    const cor = corDaCategoria(categoria);
    return (
        <span
            className="inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${cor}1a`, color: cor }}
        >
            {categoria}
        </span>
    );
}

// Abertura: um artigo ocupando a largura toda, com o título em corpo grande.
// É o que um site editorial faz e uma vitrine de produto não faz.
export function Destaque({ post }: { post: PostResumo }) {
    return (
        <Link href={`/blog/${post.slug}`} className="group grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
            <Faixa post={post} className="aspect-[16/10] rounded-sm text-[64px]" />
            <div>
                <Selo categoria={post.category} />
                <h2 className="mb-3 mt-4 font-serif text-3xl leading-[1.15] text-[#1A1A1A] transition-colors group-hover:text-[#8C2F39] md:text-[2.6rem]">
                    {post.title}
                </h2>
                {post.excerpt && (
                    <p className="mb-4 max-w-xl text-[15px] leading-relaxed text-gray-600">{post.excerpt}</p>
                )}
                <span className="text-xs uppercase tracking-wider text-gray-400">
                    {dataCurta(post.publishedAt)} · leitura de 5 min
                </span>
            </div>
        </Link>
    );
}

// Linha horizontal: miniatura à esquerda, texto à direita. Lê-se como lista de
// notícia — o oposto do cartão quadrado de produto.
export function Linha({ post }: { post: PostResumo }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex gap-4 border-b border-[#8C2F39]/8 py-5 last:border-0"
        >
            <Faixa post={post} className="h-20 w-24 shrink-0 rounded-sm text-[28px] sm:h-24 sm:w-32" />
            <div className="min-w-0">
                <Selo categoria={post.category} />
                <h3 className="mt-2 font-serif text-lg leading-snug text-[#1A1A1A] transition-colors group-hover:text-[#8C2F39]">
                    {post.title}
                </h3>
                {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{post.excerpt}</p>
                )}
            </div>
        </Link>
    );
}

// Bloco de abertura de cada seção, um pouco maior que as linhas que o seguem.
export function Aberto({ post }: { post: PostResumo }) {
    return (
        <Link href={`/blog/${post.slug}`} className="group block">
            <Faixa post={post} className="mb-4 aspect-[16/9] rounded-sm text-[44px]" />
            <Selo categoria={post.category} />
            <h3 className="mb-2 mt-3 font-serif text-2xl leading-snug text-[#1A1A1A] transition-colors group-hover:text-[#8C2F39]">
                {post.title}
            </h3>
            {post.excerpt && (
                <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
            )}
        </Link>
    );
}
