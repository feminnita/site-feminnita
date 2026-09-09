import Link from "next/link";

// A Sala de Arquivos, do blog antigo. É aqui que entram as pastas de imagem, os
// banners prontos, o lookbook e as planilhas — e é aqui que fica escrito o que
// a revendedora precisa fazer para liberar o acesso.
//
// Ainda NÃO existe a tela por trás. Os dois botões apontam para /portal, que
// será construído. Deixar o bloco no ar antes disso é de propósito: é assim que
// se descobre quem quer acesso.
export function SalaDeArquivos() {
    return (
        <section className="py-16" style={{ background: "#F5E6D3" }}>
            <div className="container mx-auto max-w-2xl px-4 text-center">
                <div
                    className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "#8C2F39" }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="1.7"
                        className="h-7 w-7"
                        aria-hidden="true"
                    >
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1H3V7Z" />
                        <path d="M3 10h18l-1.4 8.2A2 2 0 0 1 17.6 20H6.4a2 2 0 0 1-2-1.8L3 10Z" />
                    </svg>
                </div>

                <h2 className="mb-3 font-serif text-3xl" style={{ color: "#8C2F39" }}>
                    Acesse a Sala de Arquivos
                </h2>

                <p className="mb-8 leading-relaxed text-gray-600">
                    Fotos profissionais dos produtos, banners prontos, lookbook da coleção,
                    planilha de precificação e scripts de venda — tudo que você precisa para
                    trabalhar com a Feminnita.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                    <Link
                        href="/portal/solicitar-acesso"
                        className="rounded-sm px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "#8C2F39" }}
                    >
                        Solicitar acesso
                    </Link>
                    <Link
                        href="/portal/login"
                        className="rounded-sm border px-6 py-3 text-sm font-semibold transition-colors hover:bg-[#8C2F39] hover:text-white"
                        style={{ borderColor: "#8C2F39", color: "#8C2F39" }}
                    >
                        Já tenho acesso
                    </Link>
                </div>

                <p className="mt-6 text-xs leading-relaxed text-gray-500">
                    Para liberar o acesso você precisa ter feito uma compra, curtido nossa
                    postagem no Instagram e nos seguir por lá.
                </p>
            </div>
        </section>
    );
}
