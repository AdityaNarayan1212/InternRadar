import { Router } from 'express';
import multer from 'multer';
import { updateProfile, recomputeScores } from '../controllers/user.controllers';
import { uploadResume, deleteResume, getResumeUrl } from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are supported'));
      return;
    }
    cb(null, true);
  },
});

router.patch('/profile', authenticate, updateProfile);
router.post('/recompute-scores', authenticate, recomputeScores);
router.post('/resume', authenticate, upload.single('resume'), uploadResume);
router.delete('/resume', authenticate, deleteResume);
router.get('/resume-url', authenticate, getResumeUrl);

export default router;
