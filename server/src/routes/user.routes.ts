import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.patch('/profile', authenticate, updateProfile);

export default router;