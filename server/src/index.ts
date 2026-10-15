import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { ensureResumeBucket } from './lib/supabase';
import { startNotificationScheduler } from './jobs/notificationScheduler';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET?.trim();

if (!jwtSecret || jwtSecret === 'replace_with_a_long_random_string') {
  throw new Error('Set JWT_SECRET to a unique secret before starting the API.');
}

// General limiter across the API - generous, just guards against abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 10mb for resume uploads
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// Routes
app.use('/api', routes);

// Error handler (always last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
  ✅ InternRadar backend running
  🌐 http://localhost:${PORT}
  📡 API: http://localhost:${PORT}/api/health
  `);
  ensureResumeBucket();
  startNotificationScheduler();
});

export default app;