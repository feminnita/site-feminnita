import { Router } from 'express';
import * as WebhookController from '../asass/Controller';

export const asaaswebhookRoutes = Router();

asaaswebhookRoutes.post('/', WebhookController.handleAsaasEvent);
