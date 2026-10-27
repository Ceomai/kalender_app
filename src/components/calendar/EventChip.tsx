import { Pressable, StyleSheet, View } from 'react-native';

import { categoryOf, priorityOf } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { formatTimePref, type Occurrence } from '@/src/lib/calendar-utils';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { FONTS, RADII } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/** One entry inside a month/week cell: compact (title) or detailed (time, title, calendar). */
export function EventChip({ occurrence, detailed, onPress }: { occurrence: Occurrence; detailed: boolean; onPress: () => void }) {
  const { prefs } = usePreferences();
  const t = useT();
  const cat = categoryOf(occurrence.category);
  const prio = priorityOf(occurrence.priority);
  const time = occurrence.all_day ? t('time.allDay') : formatTimePref(occurrence.occurrence_start, prefs.time_format);
  const Icon = cat.icon;
  const base = [{ backgroundColor: cat.chip.bg, borderColor: cat.chip.border }, occurrence.done && { opacity: 0.6 }];

  if (!detailed) {
    return (
      <Pressable onPress={onPress} accessibilityLabel={`${time} · ${occurrence.title}`} style={[styles.compact, ...base]}>
        <View style={[styles.dot, { backgroundColor: prio.chip.dot }]} />
        <Text
          numberOfLines={1}
          style={[styles.compactText, { color: cat.chip.fg }, occurrence.done && styles.strike]}
        >
          {occurrence.title}
        </Text>
        {occurrence.repeat !== 'none' && <Text style={[styles.compactText, { color: cat.chip.fg, opacity: 0.7 }]}>↻</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.detailed, ...base]}>
      <View style={styles.meta}>
        <Icon size={12} color={cat.chip.fg} style={{ opacity: 0.8 }} />
        <Text numberOfLines={1} style={[styles.metaText, { color: cat.chip.fg }]}>
          {time}
        </Text>
        <View style={[styles.dot, styles.right, { backgroundColor: prio.chip.dot }]} />
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: cat.chip.fg }, occurrence.done && styles.strike]}>
        {occurrence.title}
      </Text>
      {!!occurrence.calendar_name && (
        <Text numberOfLines={1} style={[styles.cal, { color: cat.chip.fg }]}>
          {occurrence.calendar_name}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: RADII.md - 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  compactText: { flexShrink: 1, fontFamily: FONTS.bodyMedium, fontSize: 10, lineHeight: 13 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  right: { marginLeft: 'auto' },
  strike: { textDecorationLine: 'line-through' },
  detailed: { borderWidth: 1, borderRadius: RADII.xl, paddingHorizontal: 6, paddingVertical: 5, gap: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { flexShrink: 1, fontFamily: FONTS.bodySemi, fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.8 },
  title: { fontFamily: FONTS.bodyMedium, fontSize: 11, lineHeight: 14 },
  cal: { fontFamily: FONTS.body, fontSize: 9, opacity: 0.7 },
});
