import { Router } from 'express';
import * as ContactController from '../controller/Contact.Controller';

export const storeContactRoutes = Router();
storeContactRoutes.post('/', ContactController.send);
