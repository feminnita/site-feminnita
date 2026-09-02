import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes/routes';

export const app = express();

// Logger de requisição: método, rota, status e tempo. Sem isso não dá para
// diagnosticar nada em produção (o backend não tinha nenhum morgan/pino).
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: env.corsOrigins,
    credentials: true,
}));

// TEMP diagnóstico: ecoa o que o servidor realmente parseia do cookie. Remover.
app.get('/api/_cookiedebug', (req, res) => {
    res.json({
        cookies: (req as { cookies?: unknown }).cookies ?? null,
        rawCookieHeader: req.headers.cookie ?? null,
        nodeEnv: process.env.NODE_ENV ?? null,
    });
});

app.use(routes);

app.use(errorHandler);
