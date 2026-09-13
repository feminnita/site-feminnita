import { Router } from 'express';
import * as AffiliateController from '../controller/Affiliate.Controller';
import { authLimiter } from '../middleware/rateLimiter';

// Publica: quem se inscreve e influenciadora de fora, nao tem conta na loja.
//
// Com teto de tentativas por IP (authLimiter, 10 a cada 15 min). Formulario
// publico sem teto e convite para encher a tabela de lixo — e a Chris teria que
// separar candidata de verdade de robo na mao.
//
// So ESCRITA. A lista, os saldos e a aprovacao ficam no painel, com login.
export const storeAffiliateRoutes = Router();

storeAffiliateRoutes.post('/', authLimiter, AffiliateController.inscrever);
