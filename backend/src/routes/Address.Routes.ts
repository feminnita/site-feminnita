import { Router } from "express";
import * as AddressController from '../controller/Address.Controller';
import { requireCustomerAuth } from "../middleware/ensureAuthenticated";

export const storeAddressRoutes = Router();
storeAddressRoutes.use(requireCustomerAuth);

storeAddressRoutes.get('/', AddressController.list);
storeAddressRoutes.post('/', AddressController.create);
storeAddressRoutes.put('/:id', AddressController.update);
storeAddressRoutes.put('/:id/default', AddressController.setDefault);
storeAddressRoutes.delete('/:id', AddressController.remove);

