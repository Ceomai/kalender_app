import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EventChip } from '@/src/components/calendar/EventChip';
import { addDays, dayKey, formatDateShort, isToday, startOfWeek, weekdayLabels, type Occurrence } from '@/src/lib/calendar-utils';
import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import type { Density, WeekStart } from '@/src/theme/types';
import { Text } from '@/src/ui/Text';

type Props = {
  cursor: Date;
  weekStart: WeekStart;
  byDay: Map<string, Occurrence[]>;
  detailed: boolean;
  density: Density;
  onSelectDay: (day: Date) => void;
  onOpenEvent: (occ: Occurrence) => void;
};

/** Seven columns side by side; scrolls sideways on narrow screens (`min-w-[640px]` on the web). */
export function WeekGrid({ cursor, weekStart, byDay, detailed, density, onSelectDay, onOpenEvent }: Props) {
  const { colors } = useTheme();
  const start = startOfWeek(cursor, weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const labels = weekdayLabels(weekStart);

  return (
    <View style={[styles.card, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {days.map((day, i) => {
          const items = byDay.get(dayKey(day)) ?? [];
          const today = isToday(day);
          return (
            <View key={day.toISOString()} style={styles.col}>
              <Pressable
                onPress={() => onSelectDay(day)}
                style={({ pressed }) => [
                  styles.dayHead,
                  today ? { backgroundColor: colors.primary } : pressed && { backgroundColor: colors.accent },
                ]}
              >
                <Text style={[styles.wd, { color: today ? colors.primaryForeground : colors.foreground }]}>{labels[i]}</Text>
                <Text style={[styles.date, { color: today ? colors.primaryForeground : colors.foreground }]}>
                  {day.getDate()}
                </Text>
              </Pressable>
              <ScrollView
                nestedScrollEnabled
                style={[
                  styles.list,
                  { backgroundColor: alpha(colors.muted, 0.25), maxHeight: density === 'compact' ? 300 : 420 },
                ]}
                contentContainerStyle={styles.listContent}
              >
                {items.length === 0 ? (
                  <Text variant="small" style={styles.empty}>
                    —
                  </Text>
                ) : (
                  items.map((occ) => (
                    <EventChip key={occ.occurrence_key} occurrence={occ} detailed={detailed} onPress={() => onOpenEvent(occ)} />
                  ))
                )}
              </ScrollView>
              <Text variant="small" style={styles.foot}>
                {formatDateShort(day)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADII['3xl'], padding: 12, boxShadow: SHADOWS.sm },
  grid: { gap: 8, minWidth: 640 },
  col: { width: 104, minHeight: 320 },
  dayHead: { borderRadius: RADII['2xl'], paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center', marginBottom: 8 },
  wd: { fontFamily: FONTS.bodySemi, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.7 },
  date: { fontFamily: FONTS.heading, fontSize: 18, lineHeight: 22 },
  list: { flexGrow: 1, borderRadius: RADII['2xl'] },
  listContent: { padding: 6, gap: 4 },
  empty: { textAlign: 'center', paddingVertical: 12 },
  foot: { textAlign: 'center', marginTop: 6, fontSize: 10 },
});
