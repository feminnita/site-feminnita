import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes/routes';

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: env.corsOrigins,
    credentials: true,
}));

app.use(routes);

app.use(errorHandler);
