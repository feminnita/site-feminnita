import { fetchSettings } from "../../services/settingsService";

// Fileira do Instagram na home, logo abaixo do vídeo da vitrine.
//
// As fotos vêm de site_settings (chave `instagram_feed`), do mesmo jeito que os
// banners e o grid da home — a Chris troca no painel, sem publicar nada.
//
// NÃO puxa da API do Instagram de propósito: aquele caminho exige um app na Meta
// e um token que vence a cada 60 dias e MORRE CALADO. A seção sumiria da home
// sem ninguém perceber. Curadoria manual sempre aparece, e ainda deixa escolher
// quais posts representam a marca em vez dos últimos que caíram no feed.
type PostInstagram = { src: string; href?: string; alt: string };

type FeedInstagram = {
    handle: string;
    titulo: string;
    chamada: string;
    posts: PostInstagram[];
};

function mapFeed(value: any): FeedInstagram | null {
    const posts: PostInstagram[] = (Array.isArray(value?.posts) ? value.posts : [])
        .filter((p: any) => p?.src && p?.active !== false)
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
        .map((p: any) => ({
            src: p.src,
            href: p.href || undefined,
            alt: p.alt || "Publicação da Feminnita no Instagram",
        }));

    if (!posts.length) return null;

    const handle = String(value?.handle || "feminnita").replace(/^@/, "");
    return {
        handle,
        titulo: value?.titulo || `@${handle}`,
        chamada: value?.chamada || "Acompanhe os lançamentos e os bastidores da fábrica",
        posts: posts.slice(0, 6),
    };
}

export async function InstagramFeed() {
    const settings = await fetchSettings().catch(() => null);
    const feed = mapFeed(settings?.instagram_feed);

    // Sem foto cadastrada a seção simplesmente não existe — melhor do que uma
    // fileira de quadrados vazios na home.
    if (!feed) return null;

    const perfil = `https://www.instagram.com/${feed.handle}/`;

    return (
        <section className="px-4 py-16 md:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-10 text-center">
                    <h2 className="mb-2 text-3xl font-light">{feed.titulo}</h2>
                    <p className="text-gray-500">{feed.chamada}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
                    {feed.posts.map((post, i) => {
                        const destino = post.href || perfil;
                        return (
                            <a
                                key={`${post.src}-${i}`}
                                href={destino}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block aspect-square overflow-hidden rounded-lg bg-gray-100"
                            >
                                <img
                                    src={post.src}
                                    alt={post.alt}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                            </a>
                        );
                    })}
                </div>

                <div className="mt-8 text-center">
                    <a
                        href={perfil}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#8C2F39] hover:text-[#8C2F39]"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="5" />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
                        </svg>
                        Seguir @{feed.handle}
                    </a>
                </div>
            </div>
        </section>
    );
}
