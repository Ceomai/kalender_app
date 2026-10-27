import { Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { EventRow } from '@/src/components/calendar/EventRow';
import { useT } from '@/src/i18n';
import { dayKey, formatDayLong, type Occurrence } from '@/src/lib/calendar-utils';
import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { EmptyState } from '@/src/ui/EmptyState';
import { Text } from '@/src/ui/Text';

type Props = {
  cursor: Date;
  byDay: Map<string, Occurrence[]>;
  detailed: boolean;
  onOpenEvent: (occ: Occurrence) => void;
  onCreate: (date: Date) => void;
};

export function DayView({ cursor, byDay, detailed, onOpenEvent, onCreate }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const items = byDay.get(dayKey(cursor)) ?? [];
  const allDay = items.filter((o) => o.all_day);
  const timed = items.filter((o) => !o.all_day);

  const section = (label: string, list: Occurrence[]) =>
    list.length > 0 && (
      <View style={styles.section}>
        <Text variant="eyebrow" style={styles.sectionLabel}>
          {label}
        </Text>
        {list.map((occ) => (
          <EventRow key={occ.occurrence_key} occurrence={occ} detailed={detailed} onPress={() => onOpenEvent(occ)} />
        ))}
      </View>
    );

  return (
    <View style={styles.stack}>
      <View style={[styles.head, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
        <Text style={styles.title} numberOfLines={1}>
          {formatDayLong(cursor)}
        </Text>
        <Button size="sm" variant="outline" icon={Plus} onPress={() => onCreate(cursor)}>
          {t('day.add')}
        </Button>
      </View>
      {items.length === 0 ? (
        <EmptyState title={t('day.empty')} description={t('day.emptyDesc')} />
      ) : (
        <View style={styles.stack}>
          {section(t('day.allDaySection'), allDay)}
          {section(t('day.timedSection'), timed)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: RADII['3xl'],
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: SHADOWS.sm,
  },
  title: { flex: 1, fontFamily: FONTS.display, fontSize: 22, lineHeight: 28 },
  section: { gap: 8 },
  sectionLabel: { letterSpacing: 0.5, paddingHorizontal: 4 },
});
