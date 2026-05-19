import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 10mb for resume uploads
app.use(express.urlencoded({ extended: true }));

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
});

export default app;