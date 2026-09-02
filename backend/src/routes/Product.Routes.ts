import { Router } from 'express';
import * as ProductController from '../controller/Product.Controller';

export const storeProductRoutes = Router();

storeProductRoutes.get('/', ProductController.list);
storeProductRoutes.get('/suggestions', ProductController.suggestions);
storeProductRoutes.get('/:idOrSlug/stock', ProductController.getStock);
storeProductRoutes.post('/:idOrSlug/view', ProductController.registerView);
storeProductRoutes.get('/:idOrSlug', ProductController.getOne)
