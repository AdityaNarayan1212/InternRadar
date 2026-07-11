import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { registerSchema, loginSchema } from '../validators/auth.validators';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
