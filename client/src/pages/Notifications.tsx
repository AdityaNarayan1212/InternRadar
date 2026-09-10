import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, Clock, Loader2, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notifications';
import type { AppNotification, NotificationType } from '../types';

const ICONS: Record<NotificationType, typeof Clock> = {
  DEADLINE_REMINDER: Clock,
  REOPEN_ALERT: RefreshCw,
  NEW_MATCH: BellRing,
  WEEKLY_DIGEST: Bell,
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60));
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData<{ data: AppNotification[]; unreadCount: number }>(
        ['notifications'],
        (old) =>
          old && {
            data: old.data.map((n) => (n.id === id ? { ...n, read: true } : n)),
            unreadCount: Math.max(0, old.unreadCount - (old.data.find((n) => n.id === id)?.read ? 0 : 1)),
          }
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['unread-count'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData<{ data: AppNotification[]; unreadCount: number }>(
        ['notifications'],
        (old) => old && { data: old.data.map((n) => ({ ...n, read: true })), unreadCount: 0 }
      );
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const notifications = data?.data ?? [];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111317]">Notifications</h1>
            <p className="text-sm text-[#5B6270] mt-0.5">
              Deadline reminders and application-window alerts for your shortlist.
            </p>
          </div>
          {data && data.unreadCount > 0 && (
            <button
              type="button"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 shrink-0"
            >
              Mark all as read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-[#5B6270]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading notifications...
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn't load notifications"
            message="Something went wrong reaching the server. Try again in a moment."
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            message="Shortlist internships with upcoming deadlines and we'll remind you here."
          />
        ) : (
          <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white divide-y divide-[#E4E7EC] overflow-hidden">
            {notifications.map((n) => {
              const Icon = ICONS[n.type];
              const inner = (
                <div
                  className={`flex items-start gap-3 px-4 py-3.5 relative ${
                    !n.read ? 'bg-primary-50/40' : ''
                  }`}
                >
                  {!n.read && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500" />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      !n.read ? 'bg-primary-100 text-primary-700' : 'bg-[#FAFBFC] text-[#5B6270]'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-[#111317]' : 'text-[#5B6270]'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-[#5B6270] mt-0.5">{timeAgo(n.sentAt)}</p>
                  </div>
                </div>
              );

              return n.internshipId ? (
                <Link
                  key={n.id}
                  to={`/internships/${n.internshipId}`}
                  onClick={() => !n.read && readMutation.mutate(n.id)}
                  className="block hover:bg-[#FAFBFC] transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && readMutation.mutate(n.id)}
                  className="w-full text-left hover:bg-[#FAFBFC] transition-colors"
                >
                  {inner}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
