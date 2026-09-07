import { AppError } from '../errors/AppError';
import * as PostRepository from '../repository/Post.Repository';

function slugify(texto: string) {
    return texto
        .normalize('NFD')
        // Tira os acentos que o NFD separou das letras (ç, ã, é...).
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

export function listBlog(kind?: string) {
    return PostRepository.findMany('publico', kind);
}

export function listTraining() {
    return PostRepository.findMany('revendedora', 'aula');
}

export async function getPublic(slug: string) {
    const post = await PostRepository.findBySlug(slug, 'publico');
    if (!post) throw new AppError('Conteúdo não encontrado', 404);
    return post;
}

export async function getForReseller(slug: string) {
    const post = await PostRepository.findBySlug(slug, 'revendedora');
    if (!post) throw new AppError('Conteúdo não encontrado', 404);
    return post;
}

export async function submitStory(input: { title?: string; body?: string; authorName?: string }, customerId: string) {
    const title = (input.title || '').trim();
    const body = (input.body || '').trim();
    const authorName = (input.authorName || '').trim();

    if (title.length < 5) throw new AppError('Escreva um título com pelo menos 5 letras.', 400);
    if (body.length < 200) throw new AppError('Conte um pouco mais — pelo menos 200 letras.', 400);
    if (!authorName) throw new AppError('Diga como você quer assinar o texto.', 400);

    // Sufixo de tempo evita colisão quando duas clientes mandam histórias com
    // o mesmo título ("Minha história").
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;

    const [row] = await PostRepository.insertStory({ slug, title, body, authorName, authorCustomerId: customerId });
    return { id: row.id, status: 'em análise' };
}
