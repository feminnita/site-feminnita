import { Router } from 'express';
import * as PostController from '../controller/Post.Controller';
import { requireCustomerAuth } from '../middleware/ensureAuthenticated';

// Blog: aberto. É o que o Google indexa e o que traz gente de fora.
export const storeBlogRoutes = Router();
storeBlogRoutes.get('/', PostController.listBlog);
storeBlogRoutes.get('/:slug', PostController.getBlogPost);

// Treinamento: só para quem está logado.
export const storeTrainingRoutes = Router();
storeTrainingRoutes.use(requireCustomerAuth);
storeTrainingRoutes.get('/', PostController.listTraining);
storeTrainingRoutes.get('/:slug', PostController.getTrainingPost);

// Mandar a própria história exige login: assim sabemos de quem é o texto e
// conseguimos avisar quando for publicado.
export const storeStoryRoutes = Router();
storeStoryRoutes.use(requireCustomerAuth);
storeStoryRoutes.post('/', PostController.submitStory);
