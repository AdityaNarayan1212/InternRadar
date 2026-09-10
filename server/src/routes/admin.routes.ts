import { Router } from 'express';
import {
  createInternship,
  updateInternship,
  deactivateInternship,
  getAdminInternships,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/internships',                getAdminInternships);
router.post('/internships',               createInternship);
router.patch('/internships/:id',          updateInternship);
router.patch('/internships/:id/deactivate', deactivateInternship);

export default router;
