import { Router } from 'express';
import * as NewsletterController from '../controller/Newsletter.Controller';

// Rotas públicas: quem se inscreve ainda não tem conta na loja.
export const storeNewsletterRoutes = Router();

storeNewsletterRoutes.post('/', NewsletterController.subscribe);
storeNewsletterRoutes.post('/sair', NewsletterController.unsubscribe);
