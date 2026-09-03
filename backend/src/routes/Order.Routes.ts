import { Router } from 'express';
import * as OrderController from '../controller/Order.Controller';
import { optionalCustomerAuth, requireCustomerAuth } from '../middleware/ensureAuthenticated';

export const storeOrderRouter = Router();

// Compra sem login: criar pedido e validar cupom NÃO exigem sessão. Se houver
// cookie válido, o cliente é anexado; senão o pedido cria a conta em silêncio.
storeOrderRouter.post('/', optionalCustomerAuth, OrderController.createOrder);
storeOrderRouter.post('/coupon/preview', optionalCustomerAuth, OrderController.previewCoupon);

// Histórico do cliente continua protegido — só quem está logado vê os pedidos.
storeOrderRouter.get('/', requireCustomerAuth, OrderController.listMine);
storeOrderRouter.get('/:id', requireCustomerAuth, OrderController.getMine);