import { apiGet } from "./api";

export type PostResumo = {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    coverUrl: string | null;
    kind: string;
    authorName: string | null;
    publishedAt: string | null;
};

export type Post = PostResumo & { body: string };

export async function listarArtigos(): Promise<PostResumo[]> {
    return (await apiGet<PostResumo[]>("/api/store/blog")) ?? [];
}

export async function buscarArtigo(slug: string): Promise<Post | null> {
    // O backend devolve 404 quando não existe; apiGet trata como null.
    return apiGet<Post>(`/api/store/blog/${encodeURIComponent(slug)}`).catch(() => null);
}
