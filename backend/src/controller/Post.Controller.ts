import { Request, Response } from 'express';
import * as PostService from '../service/Post.Service';

export async function listBlog(req: Request, res: Response) {
    const kind = typeof req.query.tipo === 'string' ? req.query.tipo : undefined;
    res.json(await PostService.listBlog(kind));
}

export async function getBlogPost(req: Request, res: Response) {
    res.json(await PostService.getPublic(String(req.params.slug)));
}

export async function listTraining(_req: Request, res: Response) {
    res.json(await PostService.listTraining());
}

export async function getTrainingPost(req: Request, res: Response) {
    res.json(await PostService.getForReseller(String(req.params.slug)));
}

export async function submitStory(req: Request, res: Response) {
    const customerId = (req as any).customer.id;
    res.status(201).json(await PostService.submitStory(req.body, customerId));
}
