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

// O cupom automatico TAMBEM e aberto. Atras da trava ele so existia para quem
// tinha conta — e depois que comprar sem conta virou o caminho normal, o
// desconto de primeira compra deixou de chegar em quem ele foi feito para
// alcancar: a revendedora que esta comprando pela primeira vez.
// Antes de '/:id': 'coupon' seria lido como id de pedido.
storeOrderRouter.get('/coupon/automatico', optionalCustomerAuth, OrderController.automaticCoupon);

storeOrderRouter.use(requireCustomerAuth);
storeOrderRouter.get('/', OrderController.listMine);
storeOrderRouter.get('/:id', OrderController.getMine);
storeOrderRouter.get('/:id/pagamento', OrderController.getPaymentInfo);
storeOrderRouter.post('/:id/pagamento', OrderController.changePaymentMethod);