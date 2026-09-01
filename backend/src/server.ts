import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes/routes';

const app = express();

const allowedOrigins = [
    'https://site-feminnita.vercel.app',
    'http://localhost:3000'
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
app.use(routes);
app.set('trust proxy', 1)

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));