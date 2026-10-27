import { Bell, CalendarClock } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryOf } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { countdown, formatDateShort, formatTimePref, reminderTime } from '@/src/lib/calendar-utils';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { useUpcoming } from '@/src/services/queries';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Sheet } from '@/src/ui/Sheet';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

/** Bell with the number of entries in the next 24 hours; lists the next 7 days. */
export function ReminderBell() {
  const { colors } = useTheme();
  const { prefs } = usePreferences();
  const t = useT();
  const [open, setOpen] = useState(false);
  const events = useUpcoming(7).data;
  const shown = useRef(new Set<string>());
  // "Now" for the 24-hour badge, refreshed by the same one-minute tick.
  const [now, setNow] = useState(() => Date.now());

  // While the app is open, a toast when an entry's reminder time arrives (as on the web).
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setNow(now);
      for (const ev of events ?? []) {
        const key = `${ev.id}-${ev.start_at}`;
        const startMs = new Date(ev.start_at).getTime();
        if (reminderTime(ev).getTime() <= now && startMs > now - 30 * 60 * 1000 && !shown.current.has(key)) {
          shown.current.add(key);
          toast(ev.title, {
            description: `${formatTimePref(new Date(ev.start_at), prefs.time_format)} · ${t('rb.toastTime')}`,
          });
        }
      }
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 60000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [events, prefs.time_format, t]);

  const list = events ?? [];
  const soon = list.filter((ev) => new Date(ev.start_at).getTime() - now < 86400000);

  return (
    <>
      <Button variant="ghost" size="icon" accessibilityLabel={t('rb.aria')} onPress={() => setOpen(true)}>
        <Bell size={20} color={colors.foreground} />
        {soon.length > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{soon.length}</Text>
          </View>
        )}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <View style={[styles.head, { borderBottomColor: alpha(colors.border, 0.7) }]}>
          <CalendarClock size={16} color={colors.mutedForeground} />
          <Text variant="heading" style={styles.title}>
            {t('rb.title')}
          </Text>
        </View>
        {list.length === 0 ? (
          <Text variant="muted" style={styles.empty}>
            {t('rb.empty')}
          </Text>
        ) : (
          list.map((ev, i) => {
            const cat = categoryOf(ev.category);
            const Icon = cat.icon;
            const start = new Date(ev.start_at);
            return (
              <View
                key={ev.id}
                style={[styles.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: alpha(colors.border, 0.5) }]}
              >
                <View style={[styles.icon, { backgroundColor: cat.chip.bg, borderColor: cat.chip.border }]}>
                  <Icon size={16} color={cat.chip.fg} />
                </View>
                <View style={styles.flex}>
                  <Text variant="medium" numberOfLines={1}>
                    {ev.title}
                  </Text>
                  <Text variant="small">
                    {formatDateShort(start)} · {ev.all_day ? t('time.allDay') : formatTimePref(start, prefs.time_format)} ·{' '}
                    {countdown(start)}
                  </Text>
                  {!!ev.calendar_name && <Text variant="small">{ev.calendar_name}</Text>}
                </View>
              </View>
            );
          })
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: FONTS.bodySemi, fontSize: 10, lineHeight: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 14 },
  empty: { textAlign: 'center', paddingVertical: 24 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  icon: { width: 32, height: 32, borderRadius: RADII.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  flex: { flex: 1, minWidth: 0 },
});
