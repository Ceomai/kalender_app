// Local reminders: every reminder lead of every upcoming occurrence becomes a scheduled
// device notification, so reminders arrive with the app closed (the web only had the
// in-page bell toast and e-mails).
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { formatTimePref, type Occurrence } from '@/src/lib/calendar-utils';
import type { TimeFormat } from '@/src/theme/types';

/** iOS keeps at most 64 pending local notifications and silently drops the rest. */
export const NOTIFICATION_BUDGET = 60;
export const CHANNEL_ID = 'reminders-v1';
const SOURCE = 'takvimim-reminder';

export type PlannedReminder = {
  id: string;
  at: Date;
  title: string;
  body: string;
  eventId: string;
};

/**
 * Which notifications to schedule: one per reminder lead of each not-done occurrence,
 * only in the future, earliest first, capped at the budget.
 */
export function planReminders(
  occurrences: Occurrence[],
  opts: { now: Date; timeFormat: TimeFormat; allDayLabel: string; budget?: number },
): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  for (const o of occurrences) {
    if (o.done) continue;
    const leads = o.reminder_minutes?.length ? o.reminder_minutes : [30];
    for (const lead of new Set(leads)) {
      const at = new Date(o.occurrence_start.getTime() - lead * 60000);
      if (at <= opts.now) continue;
      const when = o.all_day ? opts.allDayLabel : formatTimePref(o.occurrence_start, opts.timeFormat);
      out.push({
        id: `${o.occurrence_key}#${lead}`,
        at,
        title: o.title,
        body: [when, o.location, o.calendar_name].filter(Boolean).join(' · '),
        eventId: o.id,
      });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, opts.budget ?? NOTIFICATION_BUDGET);
}

let handlerSet = false;

/** Shows reminders as banners while the app is open too. */
export function configureNotifications() {
  if (handlerSet || Platform.OS === 'web') return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermission(channelName: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: channelName,
      // Re-exported through `export *`, which eslint-plugin-import cannot follow (tsc can).
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Replaces this app's scheduled reminders with `planned` (others are left alone). */
export async function syncScheduledReminders(planned: PlannedReminder[]) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const wanted = new Map(planned.map((p) => [p.id, p]));
  const keep = new Set<string>();

  for (const n of scheduled) {
    if (n.content.data?.source !== SOURCE) continue;
    const p = wanted.get(n.identifier);
    // Unchanged reminders stay; moved, renamed or removed ones are cancelled.
    if (p && n.content.title === p.title && n.content.body === p.body && n.content.data?.at === p.at.toISOString()) {
      keep.add(p.id);
    } else {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  for (const p of planned) {
    if (keep.has(p.id)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: {
        title: p.title,
        body: p.body,
        sound: true,
        data: { source: SOURCE, eventId: p.eventId, at: p.at.toISOString() },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: p.at,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });
  }
}

/** Removes all of this app's scheduled reminders (on sign-out). */
export async function clearScheduledReminders() {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.source === SOURCE) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}
