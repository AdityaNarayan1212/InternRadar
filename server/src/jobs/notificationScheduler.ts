// Periodic sweep for deadline/reopen notifications, on top of the lazy
// per-user generation in notification.service.ts (see getNotifications).
// The lazy path only ever fires when a user opens the notifications page -
// this sweep means notifications exist (and could later be emailed or
// pushed) even for users who haven't opened the app recently.
//
// Runs in-process via node-cron rather than a separate worker/queue: the
// job itself is cheap (see generateNotificationsForAllUsers) and there's no
// other infra (Redis, a queue, etc.) deployed for this project, so a second
// process would be pure overhead.

import cron from 'node-cron';
import { generateNotificationsForAllUsers } from '../services/notification.service';

// Every 6 hours by default. Override for local testing, e.g.
// NOTIFICATION_CRON="*/1 * * * *" to run every minute.
const SCHEDULE = process.env.NOTIFICATION_CRON || '0 */6 * * *';

async function runSweep(): Promise<void> {
  const start = Date.now();
  try {
    const { scanned, created } = await generateNotificationsForAllUsers();
    console.log(
      `[notificationScheduler] scanned ${scanned} saved internships, created ${created} notifications (${Date.now() - start}ms)`
    );
  } catch (err) {
    console.error('[notificationScheduler] sweep failed:', err);
  }
}

export function startNotificationScheduler(): void {
  if (!cron.validate(SCHEDULE)) {
    console.error(`[notificationScheduler] invalid NOTIFICATION_CRON "${SCHEDULE}" - scheduler not started`);
    return;
  }

  cron.schedule(SCHEDULE, runSweep, {
    name: 'notification-sweep',
    noOverlap: true, // if a sweep is still running when the next tick fires, skip it rather than stack
  });
  console.log(`[notificationScheduler] scheduled "${SCHEDULE}"`);

  // Also run once shortly after boot, so a fresh deploy/restart doesn't
  // leave notifications stale for up to a full interval.
  setTimeout(runSweep, 10_000);
}
