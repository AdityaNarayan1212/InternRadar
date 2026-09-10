import { Router } from 'express';
import authRoutes from './auth.routes';
import internshipRoutes from './internship.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'InternRadar API is running' });
});

router.use('/auth',          authRoutes);
router.use('/internships',   internshipRoutes);
router.use('/users',         userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin',         adminRoutes);

export default router;