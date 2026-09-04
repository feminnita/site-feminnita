import { Router } from 'express';
import * as ResaleTermController from '../controller/ResaleTerm.Controller';
import { requireCustomerAuth } from '../middleware/ensureAuthenticated';

export const storeResaleTermRoutes = Router();

storeResaleTermRoutes.get('/', ResaleTermController.get);
storeResaleTermRoutes.post('/accept', requireCustomerAuth, ResaleTermController.accept);
