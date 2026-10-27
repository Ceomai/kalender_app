import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { dayKey, isToday, monthName } from '@/src/lib/calendar-utils';
import type { CalendarEvent } from '@/src/services/types';
import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

const MINI_WEEKDAYS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

/** Twelve mini months with an entry-count badge; tapping one opens that month. */
export function YearView({ cursor, events, onSelectMonth }: { cursor: Date; events: CalendarEvent[]; onSelectMonth: (month: number) => void }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cols = width >= 1024 ? 4 : width >= 640 ? 3 : 2;
  const year = cursor.getFullYear();
  const counts = Array.from({ length: 12 }, () => 0);
  const dayKeys = Array.from({ length: 12 }, () => new Set<string>());

  for (const ev of events) {
    const d = new Date(ev.start_at);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
    counts[d.getMonth()] += 1;
    dayKeys[d.getMonth()].add(dayKey(d));
  }

  const now = new Date();

  return (
    <View style={styles.grid}>
      {Array.from({ length: 12 }, (_, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const current = now.getFullYear() === year && now.getMonth() === month;
        return (
          <Pressable
            key={month}
            onPress={() => onSelectMonth(month)}
            style={({ pressed }) => [
              styles.card,
              { width: `${100 / cols - 2}%`, backgroundColor: colors.card },
              { borderColor: pressed ? alpha(colors.primary, 0.5) : alpha(colors.border, 0.7) },
              pressed && { boxShadow: SHADOWS.sm },
            ]}
          >
            <View style={styles.head}>
              <Text style={[styles.month, { color: current ? colors.primary : colors.foreground }]}>{monthName(month)}</Text>
              {counts[month] > 0 && (
                <View style={[styles.badge, { backgroundColor: alpha(colors.primary, 0.1) }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{counts[month]}</Text>
                </View>
              )}
            </View>
            <View style={styles.days}>
              {MINI_WEEKDAYS.map((d, i) => (
                <Text key={`w${i}`} style={[styles.cell, styles.wd, { color: alpha(colors.mutedForeground, 0.7) }]}>
                  {d}
                </Text>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <View key={`e${i}`} style={styles.cell} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = new Date(year, month, i + 1);
                const has = dayKeys[month].has(dayKey(date));
                const today = isToday(date);
                return (
                  <View key={i} style={styles.cell}>
                    <View
                      style={[
                        styles.dayDot,
                        today ? { backgroundColor: colors.primary } : has && { backgroundColor: alpha(colors.primary, 0.15) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: today ? colors.primaryForeground : has ? colors.primary : colors.mutedForeground,
                            fontFamily: today ? FONTS.bodySemi : has ? FONTS.bodyMedium : FONTS.body,
                          },
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  month: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  badge: { borderRadius: RADII.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: FONTS.bodySemi, fontSize: 10 },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  wd: { fontFamily: FONTS.bodyMedium, fontSize: 8, textAlign: 'center', textAlignVertical: 'center' },
  dayDot: { width: '90%', height: '90%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 9 },
});
