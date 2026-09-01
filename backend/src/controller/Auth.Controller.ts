import { Request, Response } from 'express';
import * as AuthService from '../service/Auth.Service';
import * as GoogleAuthService from '../service/GoogleAuth.Service';
import { generateSessionToken } from '../utils/sessionToken';
import { CUSTOMER_SESSION_COOKIE, SESSION_TTL_MS } from '../config/auth';
import { env } from '../config/env';

const isProduction = process.env.NODE_ENV === 'production';
const OAUTH_STATE_COOKIE = 'feminnita_oauth_state';

function setSessionCookie(res: Response, token: string) {
    res.cookie(CUSTOMER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: SESSION_TTL_MS,
    });
}

export async function register(req: Request, res: Response) {
    const { name, email, password } = req.body;
    const customer = await AuthService.registerCustomer({ name, email, password });
    res.status(201).json({
        id: customer.id,
        name: customer.name,
        email: customer.email
    });
}

export async function login(req: Request, res: Response) {
    const { email, password } = req.body;
    const { customer, token } = await AuthService.loginCustomer({
        email,
        password,
        userAgent: req.headers['user-agent'],
    });

    res.cookie(CUSTOMER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: SESSION_TTL_MS,
    });

    res.json({
        id: customer.id,
        name: customer.name,
        email: customer.email
    });

}

export async function logout(req: Request, res: Response) {
    const token = req.cookies?.[CUSTOMER_SESSION_COOKIE];
    if (token) await AuthService.logoutCustomer(token);
    res.clearCookie(CUSTOMER_SESSION_COOKIE);
    res.status(204).send();
}

export async function me(req: Request, res: Response) {
    res.json(req.customer);
}

export async function forgotPassword(req: Request, res: Response) {
    await AuthService.forgotPassword(req.body.email);
    res.status(204).send();
}

export async function resetPassword(req: Request, res: Response) {
    await AuthService.resetPasswordtoken(req.body.token, req.body.password);
    res.status(204).send();
};

export async function googleRedirect(_req: Request, res: Response) {
    const state = generateSessionToken();

    res.cookie(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
    });

    res.redirect(GoogleAuthService.getGoogleAuthUrl(state));
}

export async function googleCallback(req: Request, res: Response) {
    try {
        const code = req.query.code as string | undefined;
        const state = req.query.state as string | undefined;
        const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];

        res.clearCookie(OAUTH_STATE_COOKIE);

        if (!code || !state || !expectedState || state !== expectedState) {
            return res.redirect(`${env.clientUrl}/login?error=google`);
        }

        const customer = await GoogleAuthService.loginWithGoogle(code);
        const token = await AuthService.createSessionForCustomer(
            customer.id,
            req.headers['user-agent'],
        );

        setSessionCookie(res, token);
        res.redirect(env.clientUrl);
    } catch (error) {
        console.error('Google OAuth Falhou:', error);
        res.redirect(`${env.clientUrl}/login?error=google`);
    }
}