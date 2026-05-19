import { Router } from 'express';

const router = Router();

// Health check — visit localhost:5000/api/health to confirm backend is running
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'InternRadar API is running' });
});

// Routes will be added here as we build each feature
// router.use('/auth', authRoutes);
// router.use('/internships', internshipRoutes);
// router.use('/users', userRoutes);

export default router;