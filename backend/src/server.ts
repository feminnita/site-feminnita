import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { routes } from './routes/routes';
import { startExpireOrderJob } from './jobs/expireOrder.Job';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Logger de requisição: método, rota, status, tempo. Sem isso, log vazio na
// Render não prova que a requisição não chegou.
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
});

const envOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = [
    'https://feminnita.com.br',
    'https://www.feminnita.com.br',
    'https://site-feminnita.vercel.app',
    'http://localhost:3000',
    ...envOrigins,
];

app.use(cors({
    origin: (origin, callback) => {
        const isVercelPreview =
            origin?.startsWith('https://site-feminnita') &&
            origin?.endsWith('.vercel.app');

        if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
// cookieParser é OBRIGATÓRIO: sem ele req.cookies fica vazio e toda rota
// autenticada (carrinho, pedido) responde 401 "Não autenticado". Estava só
// no app.ts, que NÃO é o entry executado (server.ts cria o próprio express).
app.use(cookieParser());
app.use(routes);
// errorHandler por último: sem ele, um erro não tratado num controller vira
// HTML 500 e o front não consegue extrair {error} pra exibir ("nada acontece").
app.use(errorHandler);
app.set('trust proxy', 1)

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Libera a reserva de estoque de pedidos não pagos após o TTL. Sem isso,
    // todo PIX abandonado prende estoque pra sempre (reserved_qty nunca volta).
    startExpireOrderJob();
});