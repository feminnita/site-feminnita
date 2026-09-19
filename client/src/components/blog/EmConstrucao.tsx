import Link from "next/link";
import { Header } from "../layout/Header";

// O blog fica de fora da estreia: a loja entra no ar antes dele. Enquanto isso
// o endereco existe mas nao promete artigo nenhum — quem chegar aqui por um
// link antigo ou pelo Google encontra um aviso e um caminho de volta para a
// loja, em vez de uma lista vazia com cara de site quebrado.
//
// Para religar: BLOG_NO_AR = true em src/lib/blog.ts. Nada foi apagado.
export function BlogEmConstrucao() {
    return (
        <div className="min-h-screen bg-[#FAF6F2]">
            <Header />

            <div className="container mx-auto px-4 py-24 text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8C2F39]/70">
                    Em breve
                </p>
                <h1 className="mt-4 text-3xl font-light text-gray-900 md:text-4xl">
                    Nosso blog está sendo preparado
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-600">
                    Estamos escrevendo conteúdo para quem revende: como montar
                    grade, o que mais vende em cada estação e como precificar.
                    Enquanto isso, o catálogo já está no ar.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        href="/produtos"
                        className="rounded-xl bg-[#8C2F39] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7a2832]"
                    >
                        Ver o catálogo
                    </Link>
                    <Link
                        href="/"
                        className="text-sm text-gray-500 underline hover:text-gray-700"
                    >
                        Voltar para a página inicial
                    </Link>
                </div>
            </div>
        </div>
    );
}
