import { Router } from 'express';
import * as SiteSettingsController from '../controller/SiteSettings.Controller';

export const storeSiteSettingsRoutes = Router();
storeSiteSettingsRoutes.get('/', SiteSettingsController.list);