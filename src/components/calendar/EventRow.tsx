import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { categoryOf } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { formatTimePref, type Occurrence } from '@/src/lib/calendar-utils';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { RADII, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/** One row in the day / agenda / list views. */
export function EventRow({ occurrence, detailed, onPress }: { occurrence: Occurrence; detailed: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const { prefs } = usePreferences();
  const t = useT();
  const cat = categoryOf(occurrence.category);
  const Icon = cat.icon;
  const time = occurrence.all_day ? t('time.allDay') : formatTimePref(occurrence.occurrence_start, prefs.time_format);
  const meta = [time, cat.label];
  if (detailed && occurrence.location) meta.push(occurrence.location);
  if (detailed && occurrence.calendar_name) meta.push(occurrence.calendar_name);
  if (detailed && occurrence.description) meta.push(occurrence.description.replace(/\s+/g, ' '));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: pressed ? colors.border : alpha(colors.border, 0.6),
          backgroundColor: pressed ? alpha(colors.accent, 0.4) : colors.card,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: cat.chip.bg, borderColor: cat.chip.border }]}>
        <Icon size={16} color={cat.chip.fg} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="medium" numberOfLines={1} style={[styles.title, occurrence.done && styles.done]}>
            {occurrence.title}
          </Text>
          {occurrence.repeat !== 'none' && <Text variant="small">↻</Text>}
        </View>
        <Text variant="small" numberOfLines={detailed ? 2 : 1} style={styles.meta}>
          {meta.join(' · ')}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: RADII['2xl'],
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: { width: 36, height: 36, borderRadius: RADII.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1 },
  done: { textDecorationLine: 'line-through', opacity: 0.6 },
  meta: { marginTop: 2 },
});
