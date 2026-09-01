import { Router } from "express";
import * as CartController from "../controller/Cart.Controller";
import { requireCustomerAuth } from '../middleware/ensureAuthenticated';

export const storeCartRoutes = Router();
storeCartRoutes.use(requireCustomerAuth);

storeCartRoutes.get('/', CartController.get);
storeCartRoutes.put('/', CartController.save);
storeCartRoutes.post('/merge', CartController.merge);
storeCartRoutes.delete('/', CartController.clear);
