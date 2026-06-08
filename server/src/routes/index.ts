import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'InternRadar API is running' });
});

router.use('/auth', authRoutes);

export default router;