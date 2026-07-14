import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import companyRoutes from './routes/companies.js';
import messageRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/uploads.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));
app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'bpohire-api' }));

// REST API — the same endpoints the mobile apps will consume later.
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`BPOHire API listening on :${port}`));
