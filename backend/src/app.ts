import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rootRouter from './routes';

import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';


export const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');

app.use(helmet());
// credentials: true so the httpOnly refresh cookie travels with /auth requests.
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});
app.use('/api/v1', rootRouter);


app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.use(notFoundHandler);
app.use(errorHandler);


export default app;
