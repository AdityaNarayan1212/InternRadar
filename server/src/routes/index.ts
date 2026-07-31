import { Router } from 'express';
import authRoutes from './auth.routes';
import internshipRoutes from './internship.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'InternRadar API is running' });
});

router.use('/auth',        authRoutes);
router.use('/internships', internshipRoutes);
router.use('/users',       userRoutes);

export default router;