import * as NewsletterRepository from '../repository/Newsletter.Repository';

// Aceita o e-mail com uma validação simples e o guarda em minúsculo, sem espaço.
// Sem isso "Maria@Gmail.com " e "maria@gmail.com" viravam duas pessoas na lista.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribe(input: { email?: unknown; name?: unknown; source?: unknown }) {
    const email = String(input.email ?? '').trim().toLowerCase();
    if (!EMAIL.test(email)) throw new Error('EMAIL_INVALIDO');

    const nome = typeof input.name === 'string' ? input.name.trim().slice(0, 120) : null;
    const origem = typeof input.source === 'string' ? input.source.trim().slice(0, 40) : 'popup';

    await NewsletterRepository.subscribe({ email, name: nome || null, source: origem });
    return { ok: true };
}

export async function unsubscribe(input: { email?: unknown }) {
    const email = String(input.email ?? '').trim().toLowerCase();
    if (!EMAIL.test(email)) throw new Error('EMAIL_INVALIDO');
    await NewsletterRepository.unsubscribe(email);
    return { ok: true };
}
