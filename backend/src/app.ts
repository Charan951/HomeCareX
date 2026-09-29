import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rootRouter from './routes';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1', rootRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
