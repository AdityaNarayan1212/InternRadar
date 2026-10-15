import { Router } from 'express';
import authRoutes from './auth.routes';
import internshipRoutes from './internship.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'InternRadar API and database are ready' });
  } catch (error) {
    console.error('[health] Database check failed', error);
    res.status(503).json({ success: false, message: 'Database is unavailable' });
  }
});

router.use('/auth',          authRoutes);
router.use('/internships',   internshipRoutes);
router.use('/users',         userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin',         adminRoutes);

export default router;