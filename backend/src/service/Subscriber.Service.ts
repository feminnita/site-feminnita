import * as SubscriberRepository from '../repository/Subscriber.Repository';
import * as EmailService from '../integrations/resend/Services';
import { generateSessionToken } from '../utils/sessionToken';
import { env } from '../config/env';

const ALLOWED_ORIGINS = ['popup', 'checkout', 'bling', 'tray'];

function confirmUrl(token: string) {
    return `${env.apiUrl}/api/store/newsletter/confirm?token=${token}`;
}
function unsubUrl(token: string) {
    return `${env.apiUrl}/api/store/newsletter/unsubscribe?token=${token}`;
}

// double opt-in: cria/reativa pendente e manda e-mail de confirmação.
// Idempotente: já confirmado não recebe nada; pendente reenvia; descadastrado reativa.
export async function subscribe(rawEmail: string, origin: string) {
    const email = rawEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('INVALID_EMAIL');
    const safeOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'popup';

    const existing = await SubscriberRepository.findByEmail(email);

    if (existing?.status === 'confirmado') {
        return { status: 'already_confirmed' as const };
    }

    let confirmToken: string;
    let unsubToken: string;

    if (!existing) {
        confirmToken = generateSessionToken();
        unsubToken = generateSessionToken();
        await SubscriberRepository.insertPending({ email, origin: safeOrigin, confirmToken, unsubToken });
    } else if (existing.status === 'descadastrado') {
        confirmToken = generateSessionToken();
        unsubToken = existing.unsubToken ?? generateSessionToken();
        await SubscriberRepository.reactivatePending(email, confirmToken);
    } else {
        // pendente: reenvia com o mesmo token
        confirmToken = existing.confirmToken ?? generateSessionToken();
        unsubToken = existing.unsubToken ?? generateSessionToken();
        if (!existing.confirmToken) await SubscriberRepository.reactivatePending(email, confirmToken);
    }

    await EmailService.sendSubscriptionConfirm({
        email,
        confirmUrl: confirmUrl(confirmToken),
        unsubscribeUrl: unsubUrl(unsubToken),
    });

    return { status: 'pending' as const };
}

export async function confirm(token: string) {
    if (!token) return null;
    return SubscriberRepository.confirmByToken(token);
}

export async function unsubscribe(by: { token?: string; email?: string }) {
    if (!by.token && !by.email) return null;
    return SubscriberRepository.unsubscribe(by);
}
