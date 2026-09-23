import { Router } from "express";
import * as CartController from "../controller/Cart.Controller";
import { requireCustomerAuth } from '../middleware/ensureAuthenticated';

export const storeCartRoutes = Router();

// ANTES do requireCustomerAuth, e nao depois: quem cai aqui e exatamente a
// cliente SEM conta. Atras da trava ela levaria 401, e o carrinho dela
// continuaria invisivel — que e o problema que esta rota existe para resolver.
storeCartRoutes.post('/visitante', CartController.guardarDeVisitante);

storeCartRoutes.use(requireCustomerAuth);

storeCartRoutes.get('/', CartController.get);
storeCartRoutes.put('/', CartController.save);
storeCartRoutes.post('/merge', CartController.merge);
storeCartRoutes.delete('/', CartController.clear);
