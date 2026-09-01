import { Request, Response } from 'express';
import * as HeroSlideService from '../service/HeroSlide.Service';

export async function list(_req: Request, res: Response) {
    res.json(await HeroSlideService.listSlides());
}