import { StyleSheet, View } from 'react-native';

import { EventRow } from '@/src/components/calendar/EventRow';
import { useT } from '@/src/i18n';
import { addDays, dayKey, formatDayLong, isToday, type Occurrence } from '@/src/lib/calendar-utils';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { Text } from '@/src/ui/Text';

type Props = {
  from: Date;
  days: number;
  byDay: Map<string, Occurrence[]>;
  detailed: boolean;
  onOpenEvent: (occ: Occurrence) => void;
};

/** Days with entries in the next `days` days, grouped under a day heading. */
export function AgendaView({ from, days, byDay, detailed, onOpenEvent }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const filled = Array.from({ length: days }, (_, i) => addDays(from, i)).filter((d) => (byDay.get(dayKey(d)) ?? []).length > 0);

  if (filled.length === 0) return <EmptyState title={t('agenda.empty')} description={t('agenda.emptyDesc')} />;

  return (
    <View style={styles.stack}>
      {filled.map((day) => {
        const items = byDay.get(dayKey(day)) ?? [];
        const today = isToday(day);
        return (
          <View key={day.toISOString()} style={styles.section}>
            <View style={styles.head}>
              <Text style={[styles.day, today && { color: colors.primary }]}>{formatDayLong(day)}</Text>
              {today && (
                <View style={[styles.badge, { backgroundColor: alpha(colors.primary, 0.1) }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{t('agenda.today')}</Text>
                </View>
              )}
              <Text variant="small">
                {items.length} {t('time.records')}
              </Text>
            </View>
            {items.map((occ) => (
              <EventRow key={occ.occurrence_key} occurrence={occ} detailed={detailed} onPress={() => onOpenEvent(occ)} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 20 },
  section: { gap: 8 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  day: { fontFamily: FONTS.heading, fontSize: 14 },
  badge: { borderRadius: RADII.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: FONTS.bodySemi, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
});
