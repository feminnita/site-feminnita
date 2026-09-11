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
import { storeResaleTermRoutes } from './ResaleTerm.Routes';
import { storeNewsletterRoutes } from './Newsletter.Routes';
import { storeBlogRoutes, storeTrainingRoutes, storeStoryRoutes } from './Post.Routes';
import { storeEventRoutes } from './Event.Routes';

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
routes.use('/api/store/resale-term', storeResaleTermRoutes);
routes.use('/api/store/newsletter', storeNewsletterRoutes);
routes.use('/api/store/blog', storeBlogRoutes);
routes.use('/api/store/treinamento', storeTrainingRoutes);
routes.use('/api/store/historias', storeStoryRoutes);
routes.use('/api/store/events', storeEventRoutes);

routes.use('/api/webhooks/asaas', asaaswebhookRoutes);

// Diz QUAL commit esta rodando. Sem isso, depois de um deploy nao da para
// saber se o servidor ja subiu com o codigo novo ou ainda esta com o antigo —
// so restava adivinhar pelo horario.
const iniciadoEm = new Date().toISOString();

routes.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7),
        startedAt: iniciadoEm,
    });
});
