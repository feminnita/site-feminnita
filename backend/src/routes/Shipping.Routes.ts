import { Router } from 'express';
import * as ShippingController from '../controller/Shipping.Controller';

export const storeShippingRoutes = Router();
storeShippingRoutes.post('/quote', ShippingController.quote);