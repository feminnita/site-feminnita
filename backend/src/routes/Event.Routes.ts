import { Router } from 'express';
import * as EventController from '../controller/Event.Controller';
import { eventsLimiter } from '../middleware/rateLimiter';

// Publica de proposito: quem esta sendo medido e a visitante anonima, que por
// definicao ainda nao tem conta. Nada aqui identifica pessoa — ver o comentario
// da tabela store_events.
//
// So ESCRITA. A leitura (telas de marketing) entra depois, com autenticacao:
// termo de busca das clientes nao pode ficar aberto na internet.
export const storeEventRoutes = Router();

storeEventRoutes.post('/', eventsLimiter, EventController.registrar);
