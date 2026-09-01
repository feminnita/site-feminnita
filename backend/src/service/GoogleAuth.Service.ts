import { AppError } from '../errors/AppError';
import * as AuthRepository from '../repository/Auth.Repository';
import { env } from '../config/env';

function assertConfigured() {
    if (!env.google.clientId || !env.google.clientSecret) {
        throw new AppError('Login com Google não configurado', 503);
    }
}

export function getGoogleAuthUrl(state: string): string {
    assertConfigured();

    const params = new URLSearchParams({
        client_id: env.google.clientId,
        redirect_uri: env.google.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function fetchGoogleProfile(code: string) {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: env.google.clientId,
            client_secret: env.google.clientSecret,
            redirect_uri: env.google.redirectUri,
            grant_type: 'authorization_code',
        }),
    });

    if (!tokenResponse.ok) throw new AppError('Falha na autenticação com o Google', 401);
    const tokens = (await tokenResponse.json()) as { access_token?: string }
    if (!tokens.access_token) throw new AppError('Falha na auitenticação com o google', 401);

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) throw new AppError('Falha ao obter perfil do Google', 401);

    return (await profileResponse.json()) as {
        sub: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
    };
}

export async function loginWithGoogle(code: string) {
    assertConfigured();

    const profile = await fetchGoogleProfile(code);
    if (!profile.sub || !profile.email) {
        throw new AppError('O Google não retornou os dados necessários', 401);
    }

    const byEmail = await AuthRepository.findCustomerByEmail(profile.email);

    if (byEmail) {
        await AuthRepository.linkGoogleAccount(byEmail.id, profile.sub);

        return byEmail;
    }

    return AuthRepository.insertGoogleCustomer({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        googleId: profile.sub,
    });
}
