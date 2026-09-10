import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/',              authenticate, getNotifications);
router.get('/unread-count',  authenticate, getUnreadCount);
router.patch('/read-all',    authenticate, markAllAsRead);
router.patch('/:id/read',    authenticate, markAsRead);

export default router;
