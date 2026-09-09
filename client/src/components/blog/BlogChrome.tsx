import Link from "next/link";

// Cabeçalho e rodapé PRÓPRIOS do blog, com logo próprio.
//
// Era isso que dava ao blog antigo cara de site: ele não era uma seção da loja
// pendurada no cabeçalho dela, era uma publicação com identidade sua. Repor o
// logo "Feminnita BLOG" e o rodapé é o que separa "site" de "página interna".
const BORGONHA = "#8C2F39";

export function BlogHeader() {
    return (
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur">
            <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
                <Link href="/blog" className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl leading-none text-[#1A1A1A]">
                        Feminn<span style={{ color: BORGONHA }}>ita</span>
                    </span>
                    <span
                        className="text-[10px] font-bold uppercase tracking-[0.28em]"
                        style={{ color: "#D4A956" }}
                    >
                        Blog
                    </span>
                </Link>

                <nav className="hidden items-center gap-7 md:flex">
                    <Link href="/blog" className="text-sm text-gray-600 transition-colors hover:text-[#8C2F39]">
                        Início
                    </Link>
                    <Link
                        href="/blog?categoria=Treinamento"
                        className="text-sm text-gray-600 transition-colors hover:text-[#8C2F39]"
                    >
                        Treinamento
                    </Link>
                    <Link
                        href="/blog?categoria=Tecidos%20%26%20Produtos"
                        className="text-sm text-gray-600 transition-colors hover:text-[#8C2F39]"
                    >
                        Tecidos
                    </Link>
                    <Link
                        href="/produtos"
                        className="rounded-sm px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: BORGONHA }}
                    >
                        Comprar no Atacado →
                    </Link>
                </nav>

                {/* No celular só a chamada de compra: menu sanfona aqui seria
                    peso extra para três links. */}
                <Link
                    href="/produtos"
                    className="rounded-sm px-3 py-2 text-xs font-semibold text-white md:hidden"
                    style={{ background: BORGONHA }}
                >
                    Atacado →
                </Link>
            </div>
        </header>
    );
}

export function BlogFooter() {
    return (
        <footer className="mt-0 bg-[#1A1A1A] py-12 text-white/70">
            <div className="container mx-auto grid gap-10 px-4 sm:grid-cols-3">
                <div>
                    <Link href="/blog" className="flex items-baseline gap-2">
                        <span className="font-serif text-xl text-white">
                            Feminn<span style={{ color: "#D4A956" }}>ita</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
                            Blog
                        </span>
                    </Link>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed">
                        Conteúdo para revendedoras e amantes de moda de dormir.
                    </p>
                </div>

                <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Blog</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/blog" className="hover:text-white">Início</Link></li>
                        <li><Link href="/blog?categoria=Treinamento" className="hover:text-white">Treinamento</Link></li>
                        <li><Link href="/blog?categoria=Bem-Estar%20%26%20Sono" className="hover:text-white">Bem-estar</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Feminnita</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/produtos" className="hover:text-white">Comprar no atacado</Link></li>
                        <li><Link href="/como-comprar" className="hover:text-white">Como comprar</Link></li>
                        <li><Link href="/central-de-ajuda" className="hover:text-white">Central de ajuda</Link></li>
                    </ul>
                </div>
            </div>

            <div className="container mx-auto mt-10 border-t border-white/10 px-4 pt-6">
                <p className="text-xs">
                    © {new Date().getFullYear()} Feminnita · Nova Friburgo, RJ
                </p>
            </div>
        </footer>
    );
}
