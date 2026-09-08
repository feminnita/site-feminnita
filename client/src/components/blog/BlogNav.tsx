import Link from "next/link";
import { COR_DA_CATEGORIA } from "./categorias";

// Barra própria do blog, logo abaixo da barra da loja. É ela que avisa "aqui
// começa outra seção": sem isso o blog parece uma listagem de produtos com
// artigos no lugar das peças.
export function BlogNav({ ativa }: { ativa?: string }) {
    const itens = ["Todos", ...Object.keys(COR_DA_CATEGORIA)];

    return (
        <nav className="sticky top-0 z-20 border-b border-[#8C2F39]/10 bg-[#FAF6F2]/95 backdrop-blur">
            <div className="container mx-auto flex items-center gap-6 overflow-x-auto px-4 py-3">
                <Link
                    href="/blog"
                    className="shrink-0 font-serif text-lg tracking-wide text-[#8C2F39]"
                >
                    Blog
                </Link>

                <span className="h-4 w-px shrink-0 bg-[#8C2F39]/15" />

                <div className="flex items-center gap-1">
                    {itens.map((nome) => {
                        const eAtiva = nome === "Todos" ? !ativa : ativa === nome;
                        return (
                            <Link
                                key={nome}
                                href={nome === "Todos" ? "/blog" : `/blog?categoria=${encodeURIComponent(nome)}`}
                                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                                    eAtiva
                                        ? "bg-[#8C2F39] text-white"
                                        : "text-gray-600 hover:bg-[#8C2F39]/8 hover:text-[#8C2F39]"
                                }`}
                            >
                                {nome}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
