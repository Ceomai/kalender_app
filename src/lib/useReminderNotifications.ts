import { useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useT } from '@/src/i18n';
import { addDays, expandEvents, startOfDay } from '@/src/lib/calendar-utils';
import {
  configureNotifications,
  ensureNotificationPermission,
  planReminders,
  syncScheduledReminders,
} from '@/src/lib/notifications';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { useEvents } from '@/src/services/queries';

const WINDOW_DAYS = 14;

/**
 * Keeps the device's scheduled reminders in step with the next two weeks of entries.
 * Re-plans whenever the entries change and when the app comes back to the foreground.
 */
export function useReminderNotifications() {
  const t = useT();
  const { prefs } = usePreferences();
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [allowed, setAllowed] = useState(false);

  const range = useMemo(() => ({ from: day, to: addDays(day, WINDOW_DAYS) }), [day]);
  const events = useEvents({ from: range.from.toISOString(), to: range.to.toISOString() }).data;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    configureNotifications();
    let cancelled = false;
    ensureNotificationPermission(t('nav.reminders'))
      .then((ok) => {
        if (!cancelled) setAllowed(ok);
      })
      .catch(() => {});
    // A new day moves the two-week window (and re-plans).
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDay(startOfDay(new Date()));
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [t]);

  useEffect(() => {
    if (!allowed || !events) return;
    const planned = planReminders(expandEvents(events, range.from, range.to), {
      now: new Date(),
      timeFormat: prefs.time_format,
      allDayLabel: t('time.allDay'),
    });
    syncScheduledReminders(planned).catch((err) => console.warn('[notifications] sync failed', err));
  }, [allowed, events, range, prefs.time_format, t]);
}
