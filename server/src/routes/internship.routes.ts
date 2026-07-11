import { Router } from 'express';
import {
  getInternships, getInternshipById,
  toggleSave, getSaved, updateStatus
} from '../controllers/internship.controller';
import { authenticate } from '../middleware/auth';
import { analyzeInternshipFit } from '../controllers/ai.controller';

const router = Router();

router.get('/',           getInternships);
router.get('/saved',      authenticate, getSaved);
router.get('/:id',        getInternshipById);
router.post('/:id/save',  authenticate, toggleSave);
router.patch('/:id/status', authenticate, updateStatus);

router.post('/:id/analyze', authenticate, analyzeInternshipFit);

export default router;