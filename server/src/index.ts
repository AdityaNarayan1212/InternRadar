import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL;
const isProduction = NODE_ENV === 'production';

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (isProduction && !databaseUrl) {
  console.error('[FATAL] DATABASE_URL or DIRECT_URL must be set in production');
  process.exit(1);
}

if (isProduction && !process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET must be set in production');
  process.exit(1);
}

if (isProduction && !CLIENT_URL) {
  console.error('[FATAL] CLIENT_URL must be set in production');
  process.exit(1);
}

const allowedOrigins = (CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' })); // 10mb for resume uploads
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handler (always last)
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  process.exit(1);
});

console.log('Environment:', NODE_ENV);
console.log('Port:', PORT);
console.log('Client URL:', allowedOrigins.join(', '));
console.log('Groq loaded:', !!process.env.GROQ_API_KEY);
console.log('Groq prefix:', process.env.GROQ_API_KEY?.slice(0, 12));

app.listen(PORT, () => {
  const hostUrl = isProduction ? `http://0.0.0.0:${PORT}` : `http://localhost:${PORT}`;
  console.log(`\n  ✅ InternRadar backend running\n  🌐 ${hostUrl}\n  📡 API: ${hostUrl}/api/health\n  `);
});

export default app;