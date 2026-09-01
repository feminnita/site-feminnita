import { Router } from 'express';
import * as ProductColorController from '../controller/ProductColor.Controller';

export const storeProductColorRoutes = Router();

storeProductColorRoutes.get('/', ProductColorController.list);
