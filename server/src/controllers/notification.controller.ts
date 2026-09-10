import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateNotificationsForUser } from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await generateNotificationsForUser(userId);

    const [data, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    res.json({ success: true, data, unreadCount });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Cheap count-only endpoint for a navbar badge - skips generation so it can
// be polled without repeatedly re-scanning the user's shortlist.
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const unreadCount = await prisma.notification.count({ where: { userId, read: false } });
    res.json({ success: true, unreadCount });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};
