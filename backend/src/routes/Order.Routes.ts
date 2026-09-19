import { Router } from 'express';
import * as OrderController from '../controller/Order.Controller';
import { requireCustomerAuth } from '../middleware/ensureAuthenticated';

export const storeOrderRouter = Router();
storeOrderRouter.use(requireCustomerAuth);

storeOrderRouter.post('/', OrderController.createOrder);
storeOrderRouter.post('/coupon/preview', OrderController.previewCoupon);
// Antes de '/:id': 'coupon' seria lido como id de pedido.
storeOrderRouter.get('/coupon/automatico', OrderController.automaticCoupon);
storeOrderRouter.get('/', OrderController.listMine);
storeOrderRouter.get('/:id', OrderController.getMine);
storeOrderRouter.get('/:id/pagamento', OrderController.getPaymentInfo);
storeOrderRouter.post('/:id/pagamento', OrderController.changePaymentMethod);