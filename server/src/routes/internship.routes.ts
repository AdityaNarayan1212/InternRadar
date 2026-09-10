import { Router } from 'express';
import {
  getInternships, getInternshipById,
  toggleSave, getSaved, updateStatus
} from '../controllers/internship.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/',           optionalAuth, getInternships);
router.get('/saved',      authenticate, getSaved);
router.get('/:id',        optionalAuth, getInternshipById);
router.post('/:id/save',  authenticate, toggleSave);
router.patch('/:id/status', authenticate, updateStatus);

export default router;