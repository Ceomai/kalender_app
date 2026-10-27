import { Pressable, StyleSheet, View } from 'react-native';

import { EventChip } from '@/src/components/calendar/EventChip';
import { useT } from '@/src/i18n';
import { dayKey, isToday, weekdayLabels, type Occurrence } from '@/src/lib/calendar-utils';
import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import type { Density, WeekStart } from '@/src/theme/types';
import { Text } from '@/src/ui/Text';

type Props = {
  cursor: Date;
  weekStart: WeekStart;
  weeks: Date[][];
  byDay: Map<string, Occurrence[]>;
  detailed: boolean;
  density: Density;
  onSelectDay: (day: Date) => void;
  onOpenEvent: (occ: Occurrence) => void;
};

export function MonthGrid({ cursor, weekStart, weeks, byDay, detailed, density, onSelectDay, onOpenEvent }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const labels = weekdayLabels(weekStart);
  const limit = detailed ? 2 : 3;
  const line = alpha(colors.border, 0.6);

  return (
    <View style={[styles.card, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
      <View style={[styles.head, { borderBottomColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.muted, 0.4) }]}>
        {labels.map((l) => (
          <Text key={l} style={[styles.headText, { color: colors.mutedForeground }]}>
            {l}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={[styles.week, wi > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: line }]}>
          {week.map((day, di) => {
            const items = byDay.get(dayKey(day)) ?? [];
            const outside = day.getMonth() !== cursor.getMonth();
            const today = isToday(day);
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => onSelectDay(day)}
                style={[
                  styles.cell,
                  { minHeight: density === 'compact' ? 84 : 96 },
                  di > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: line },
                  outside && { backgroundColor: alpha(colors.muted, 0.2) },
                ]}
              >
                <View style={[styles.num, today && { backgroundColor: colors.primary, boxShadow: SHADOWS.sm }]}>
                  <Text
                    style={[
                      styles.numText,
                      {
                        color: today
                          ? colors.primaryForeground
                          : outside
                            ? alpha(colors.mutedForeground, 0.6)
                            : colors.foreground,
                      },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.items}>
                  {items.slice(0, limit).map((occ) => (
                    <EventChip key={occ.occurrence_key} occurrence={occ} detailed={detailed} onPress={() => onOpenEvent(occ)} />
                  ))}
                  {items.length > limit && (
                    <Text numberOfLines={1} style={[styles.more, { color: colors.mutedForeground }]}>
                      +{items.length - limit} {t('time.records')}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADII['3xl'], overflow: 'hidden', boxShadow: SHADOWS.sm },
  head: { flexDirection: 'row', borderBottomWidth: 1 },
  headText: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  week: { flexDirection: 'row' },
  cell: { flex: 1, minWidth: 0, padding: 3 },
  num: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  numText: { fontFamily: FONTS.bodySemi, fontSize: 11 },
  items: { gap: 3 },
  more: { fontFamily: FONTS.bodyMedium, fontSize: 9, paddingHorizontal: 2 },
});
