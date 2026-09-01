import { Router } from 'express';
import { storeAuthRoutes } from './Auth.Routes';
import { storeOrderRouter } from './Order.Routes';
import { storeCategoryRoutes } from './Category.Routes';
import { storeProductRoutes } from './Product.Routes';
import { storeProductColorRoutes } from './ProductColor.Routes';
import { storeAddressRoutes } from './Address.Routes';
import { storeCartRoutes } from './Cart.Routes';
import { storeShippingRoutes } from './Shipping.Routes';
import { storeSiteSettingsRoutes } from './SiteSettings.Routes';
import { asaaswebhookRoutes } from '../integrations/asass/WebhookRoutes';
import { storeHeroSlideRoutes } from './HeroSlide.Routes';
import { storeAccountRoutes } from './Account.Routes';
import { storeNewsletterRoutes } from './Newsletter.Routes';

export const routes = Router();

routes.use('/api/store/auth', storeAuthRoutes);
routes.use('/api/store/account', storeAccountRoutes);
routes.use('/api/store/orders', storeOrderRouter);
routes.use('/api/store/categories', storeCategoryRoutes);
routes.use('/api/store/products', storeProductRoutes);
routes.use('/api/store/colors', storeProductColorRoutes);
routes.use('/api/store/addresses', storeAddressRoutes);
routes.use('/api/store/cart', storeCartRoutes);
routes.use('/api/store/settings', storeSiteSettingsRoutes);
routes.use('/api/store/shipping', storeShippingRoutes);
routes.use('/api/store/hero-slides', storeHeroSlideRoutes);
routes.use('/api/store/newsletter', storeNewsletterRoutes);

routes.use('/api/webhooks/asaas', asaaswebhookRoutes);

routes.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
