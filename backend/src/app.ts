import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rootRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

import { HttpError } from './modules/auth/auth.types';

export const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());

// Strict origin allow-list with credentials for session cookies
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new HttpError(403, 'CORS origin not allowed', 'CORS_FORBIDDEN'));
    },
    credentials: true,
  }),
);

// Keep the exact bytes of the body: the payment webhook signature is an HMAC over the RAW request.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  }),
);

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1', rootRouter);

// Error Handling Pipeline (registered exactly once, in order)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;