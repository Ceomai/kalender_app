import { Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AgendaView } from '@/src/components/calendar/AgendaView';
import { CategoryFilter } from '@/src/components/calendar/CategoryFilter';
import { EventDialog } from '@/src/components/calendar/EventDialog';
import { PendingInvitations } from '@/src/components/calendar/PendingInvitations';
import { PageHeader } from '@/src/components/layout/PageHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PRIORITIES } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { addDays, endOfDay, expandEvents, groupByDay, startOfDay, type Occurrence } from '@/src/lib/calendar-utils';
import { useCalendars, useEvents } from '@/src/services/queries';
import type { Priority } from '@/src/services/types';
import { SHADOWS, RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { ErrorCard, LoadingCard } from '@/src/ui/EmptyState';
import { Pill, PillRow } from '@/src/ui/Pill';
import { SearchInput } from '@/src/ui/SearchInput';

const RANGES = [1, 7, 30, 90];

/** Detailed list of upcoming entries, filtered by category, priority, period and title. */
export default function RemindersScreen() {
  const { colors } = useTheme();
  const t = useT();
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [rangeDays, setRangeDays] = useState(30);
  const [dialog, setDialog] = useState<{ occurrence: Occurrence | null; date: Date } | null>(null);
  // The period starts today; recomputed only when the length changes.
  const [today] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const to = useMemo(() => endOfDay(addDays(today, rangeDays)), [today, rangeDays]);
  const eventsQuery = useEvents({
    from: today.toISOString(),
    to: to.toISOString(),
    categories: activeCategories.length ? activeCategories : undefined,
    priority: priority === 'all' ? undefined : priority,
    search: search || undefined,
  });
  const calendars = useCalendars().data ?? [];

  const byDay = useMemo(() => groupByDay(expandEvents(eventsQuery.data, today, to)), [eventsQuery.data, today, to]);

  return (
    <Screen>
      <PendingInvitations />
      <PageHeader
        eyebrow={t('rm.eyebrow')}
        title={t('rm.title')}
        intro={t('rm.intro')}
        action={
          <Button icon={Plus} onPress={() => setDialog({ occurrence: null, date: new Date() })}>
            {t('rm.new')}
          </Button>
        }
      />

      <View style={[styles.filters, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
        <CategoryFilter
          active={activeCategories}
          onToggle={(id) => setActiveCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
          onClear={() => setActiveCategories([])}
        />
        <SearchInput value={searchInput} onChangeText={setSearchInput} placeholder={t('rm.search')} />
        <PillRow>
          <Pill label={t('rm.allPriorities')} selected={priority === 'all'} onPress={() => setPriority('all')} />
          {PRIORITIES.map((p) => (
            <Pill
              key={p.id}
              label={p.label}
              dot={p.chip.dot}
              colors={p.chip}
              selected={priority === p.id}
              onPress={() => setPriority(p.id)}
            />
          ))}
        </PillRow>
        <PillRow>
          {RANGES.map((r) => (
            <Pill key={r} label={t(`rm.range.${r}`)} selected={rangeDays === r} onPress={() => setRangeDays(r)} />
          ))}
        </PillRow>
      </View>

      {eventsQuery.isPending ? (
        <LoadingCard />
      ) : eventsQuery.isError ? (
        <ErrorCard message={t('rm.error')} />
      ) : (
        <AgendaView
          from={today}
          days={rangeDays}
          byDay={byDay}
          detailed
          onOpenEvent={(occ) => setDialog({ occurrence: occ, date: occ.occurrence_start })}
        />
      )}

      <EventDialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        occurrence={dialog?.occurrence ?? null}
        defaultDate={dialog?.date ?? new Date()}
        calendars={calendars}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { borderWidth: 1, borderRadius: RADII['3xl'], padding: 16, gap: 12, boxShadow: SHADOWS.sm },
});
