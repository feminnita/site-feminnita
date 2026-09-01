import { Request, Response } from 'express';
import * as SiteSettingsRepository from '../repository/SiteSettings.Repository';

export async function list(req: Request, res: Response) {

    try {
        const settings = await SiteSettingsRepository.findAll();

        const byKey = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

        res.json(byKey);
    } catch (error: any) {
        console.error('CAUSA REAL:', error?.cause ?? error);
        res.status(500).json({ error: 'db' });
    }

}