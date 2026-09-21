import { Router } from 'express';
import * as OrderController from '../controller/Order.Controller';
import { optionalCustomerAuth, requireCustomerAuth } from '../middleware/ensureAuthenticated';

export const storeOrderRouter = Router();

// CRIAR pedido e a unica rota aberta a quem nao tem conta: a cliente se
// identifica no proprio checkout (nome, e-mail, WhatsApp). Todo o resto —
// ver pedido, historico, trocar pagamento — continua exigindo sessao, porque
// sao dados de uma pessoa especifica.
storeOrderRouter.post('/', optionalCustomerAuth, OrderController.createOrder);

// Previa de cupom tambem: e so um calculo na tela. Exigir sessao aqui
// bloquearia o cupom para quem compra sem conta — e a checagem de verdade
// ("esta cliente ja usou?") roda na criacao do pedido, com identidade.
storeOrderRouter.post('/coupon/preview', optionalCustomerAuth, OrderController.previewCoupon);

storeOrderRouter.use(requireCustomerAuth);
// Antes de '/:id': 'coupon' seria lido como id de pedido.
storeOrderRouter.get('/coupon/automatico', OrderController.automaticCoupon);
storeOrderRouter.get('/', OrderController.listMine);
storeOrderRouter.get('/:id', OrderController.getMine);
storeOrderRouter.get('/:id/pagamento', OrderController.getPaymentInfo);
storeOrderRouter.post('/:id/pagamento', OrderController.changePaymentMethod);