import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import healthRouter from './routes/health.js';
import leadsRouter from './routes/leads.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Trust the first proxy (nginx). Required for rate limiting and IP logging
// to work correctly when running behind a reverse proxy on Hetzner VPS.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/health', healthRouter);
app.use('/api/leads', leadsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
