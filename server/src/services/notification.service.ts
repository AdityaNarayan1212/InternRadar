// Generates Notification rows from current state. Two entry points:
//   - generateNotificationsForUser: runs lazily whenever a user opens their
//     notifications page (see getNotifications), so their view is always
//     fresh the moment they look.
//   - generateNotificationsForAllUsers: run periodically by
//     jobs/notificationScheduler.ts, so notifications exist (and could later
//     be emailed/pushed) even for users who haven't opened the app.
// Both are idempotent - they check for an existing notification of the same
// type before creating one, so neither path spams duplicates.

import { prisma } from '../lib/prisma';

const DEADLINE_WINDOW_DAYS = 2;

export async function generateNotificationsForUser(userId: string): Promise<void> {
  const saved = await prisma.savedInternship.findMany({
    where: { userId, applicationStatus: { not: 'REJECTED' } },
    include: { internship: true },
  });

  for (const s of saved) {
    const internship = s.internship;
    if (!internship) continue;

    if (internship.deadline) {
      const daysLeft = Math.ceil(
        (internship.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft >= 0 && daysLeft <= DEADLINE_WINDOW_DAYS) {
        const existing = await prisma.notification.findFirst({
          where: { userId, internshipId: internship.id, type: 'DEADLINE_REMINDER' },
        });
        if (!existing) {
          const when =
            daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
          await prisma.notification.create({
            data: {
              userId,
              internshipId: internship.id,
              type: 'DEADLINE_REMINDER',
              message: `Deadline ${when} for ${internship.title} at ${internship.company}`,
            },
          });
        }
      }
    }

    if (internship.status === 'REOPENING') {
      const existing = await prisma.notification.findFirst({
        where: { userId, internshipId: internship.id, type: 'REOPEN_ALERT' },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            internshipId: internship.id,
            type: 'REOPEN_ALERT',
            message: `Application window just opened for ${internship.title} at ${internship.company}`,
          },
        });
      }
    }
  }
}

type NotificationCandidate = {
  userId: string;
  internshipId: string;
  type: 'DEADLINE_REMINDER' | 'REOPEN_ALERT';
  message: string;
};

// Same rules as generateNotificationsForUser, but scanned across every user
// in one pass for the periodic sweep (see jobs/notificationScheduler.ts).
// Does two bulk queries total instead of looping per user - one to find
// candidates, one to find which of them already have a notification - so
// this stays cheap even as the user base grows.
export async function generateNotificationsForAllUsers(): Promise<{
  scanned: number;
  created: number;
}> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const saved = await prisma.savedInternship.findMany({
    where: {
      applicationStatus: { not: 'REJECTED' },
      internship: {
        OR: [{ deadline: { gte: now, lte: windowEnd } }, { status: 'REOPENING' }],
      },
    },
    select: {
      userId: true,
      internshipId: true,
      internship: {
        select: { title: true, company: true, deadline: true, status: true },
      },
    },
  });

  if (saved.length === 0) return { scanned: 0, created: 0 };

  const candidates: NotificationCandidate[] = [];
  for (const s of saved) {
    const internship = s.internship;

    if (internship.deadline) {
      const daysLeft = Math.ceil((internship.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= DEADLINE_WINDOW_DAYS) {
        const when = daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
        candidates.push({
          userId: s.userId,
          internshipId: s.internshipId,
          type: 'DEADLINE_REMINDER',
          message: `Deadline ${when} for ${internship.title} at ${internship.company}`,
        });
      }
    }

    if (internship.status === 'REOPENING') {
      candidates.push({
        userId: s.userId,
        internshipId: s.internshipId,
        type: 'REOPEN_ALERT',
        message: `Application window just opened for ${internship.title} at ${internship.company}`,
      });
    }
  }

  if (candidates.length === 0) return { scanned: saved.length, created: 0 };

  // One query to find which candidates already have a matching notification,
  // instead of an existence check per row.
  const existing = await prisma.notification.findMany({
    where: {
      userId: { in: [...new Set(candidates.map((c) => c.userId))] },
      internshipId: { in: [...new Set(candidates.map((c) => c.internshipId))] },
      type: { in: ['DEADLINE_REMINDER', 'REOPEN_ALERT'] },
    },
    select: { userId: true, internshipId: true, type: true },
  });
  const existingKeys = new Set(
    existing.map((e: { userId: string; internshipId: string | null; type: string }) => `${e.userId}:${e.internshipId}:${e.type}`)
  );

  const toCreate = candidates.filter(
    (c) => !existingKeys.has(`${c.userId}:${c.internshipId}:${c.type}`)
  );
  if (toCreate.length === 0) return { scanned: saved.length, created: 0 };

  await prisma.notification.createMany({ data: toCreate });
  return { scanned: saved.length, created: toCreate.length };
}
