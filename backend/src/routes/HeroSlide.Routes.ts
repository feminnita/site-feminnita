import { Router } from 'express';
import * as HeroSlideController from '../controller/HeroSlide.Controller';

export const storeHeroSlideRoutes = Router();

storeHeroSlideRoutes.get('/', HeroSlideController.list);