import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { router } from './routes';
import { errorHandler, notFound } from './middlewares/error-handler';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(helmet());
// Same-origin requests (frontend and API on one Vercel domain) need no CORS;
// CORS_ORIGINS lists extra origins, e.g. a separately hosted frontend.
app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : false }));
app.use(express.json({ limit: '32kb' }));

app.use('/api', router);
app.use(notFound);
app.use(errorHandler);

export default app;
