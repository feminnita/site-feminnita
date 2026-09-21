import { NextFunction, Request, Response } from 'express';
import * as AuthRepository from '../repository/Auth.Repository';
import { hashSessionToken } from '../utils/sessionToken';
import { CUSTOMER_SESSION_COOKIE } from '../config/auth';

export async function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.[CUSTOMER_SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: 'Não autenticado' });

    const session = await AuthRepository.findActiveSessionByTokenHash(hashSessionToken(token));
    if (!session) return res.status(401).json({ error: 'Sessão inválida ou expirada' });

    req.customer = await AuthRepository.findCustomerById(session.customerId);
    next();
}


/**
 * Identifica a cliente SE ela estiver logada, e segue em frente se nao estiver.
 *
 * Existe para a compra sem conta. O requireCustomerAuth acima corta com 401
 * antes de o pedido chegar ao controlador — e obrigar cadastro para comprar
 * derruba conversao, ainda mais no atacado, onde quem chega ja decidiu.
 *
 * Aqui a sessao e um bonus: quando existe, o pedido nasce ligado a conta e
 * entra em "Meus Pedidos"; quando nao existe, o controlador usa os dados que a
 * cliente digitou no checkout.
 */
export async function optionalCustomerAuth(req: Request, _res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.[CUSTOMER_SESSION_COOKIE];
        if (!token) return next();

        const session = await AuthRepository.findActiveSessionByTokenHash(hashSessionToken(token));
        if (!session) return next();

        req.customer = await AuthRepository.findCustomerById(session.customerId);
    } catch {
        // Sessao ilegivel nao pode impedir a compra: segue como convidada.
    }
    next();
}
