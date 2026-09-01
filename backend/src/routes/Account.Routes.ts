import { Router } from 'express';
import * as AccountController from '../controller/Account.Controller';
import { requireCustomerAuth } from '../middleware/ensureAuthenticated';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../db/schema';

export const storeAccountRoutes = Router();
storeAccountRoutes.use(requireCustomerAuth);

storeAccountRoutes.get('/', AccountController.getProfile);
storeAccountRoutes.put('/', validate(updateProfileSchema), AccountController.updateProfile);