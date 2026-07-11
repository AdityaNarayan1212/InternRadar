import { Router } from 'express';
import { updateProfile } from '../controllers/user.controllers';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../validators/user.validators';

const router = Router();
router.patch('/profile', authenticate, validateBody(updateProfileSchema), updateProfile);

export default router;
