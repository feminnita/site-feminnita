import { Router } from 'express';
import * as SubscriberController from '../controller/Subscriber.Controller';

export const storeNewsletterRoutes = Router();

storeNewsletterRoutes.post('/subscribe', SubscriberController.subscribe);
storeNewsletterRoutes.get('/confirm', SubscriberController.confirm);
storeNewsletterRoutes.get('/unsubscribe', SubscriberController.unsubscribe);
