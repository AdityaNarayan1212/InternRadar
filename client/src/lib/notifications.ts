import api from './axios';
import type { AppNotification } from '../types';

export async function fetchNotifications(): Promise<{ data: AppNotification[]; unreadCount: number }> {
  const res = await api.get<{ success: boolean; data: AppNotification[]; unreadCount: number }>(
    '/notifications'
  );
  return { data: res.data.data, unreadCount: res.data.unreadCount };
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<{ success: boolean; unreadCount: number }>('/notifications/unread-count');
  return res.data.unreadCount;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
