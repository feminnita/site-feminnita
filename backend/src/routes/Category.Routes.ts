import { Router } from 'express';
import * as CategoryController from '../controller/Category.Controller';

export const storeCategoryRoutes = Router();

storeCategoryRoutes.get('/', CategoryController.list);
storeCategoryRoutes.get('/:slug', CategoryController.getOne);
