import { useMemo, useState } from 'react';

import { AgendaView } from '@/src/components/calendar/AgendaView';
import { CategoryFilter } from '@/src/components/calendar/CategoryFilter';
import { DayView } from '@/src/components/calendar/DayView';
import { EventDialog } from '@/src/components/calendar/EventDialog';
import { MonthGrid } from '@/src/components/calendar/MonthGrid';
import { QuickAddDialog } from '@/src/components/calendar/QuickAddDialog';
import { Toolbar, type RangeShortcut } from '@/src/components/calendar/Toolbar';
import { WeekGrid } from '@/src/components/calendar/WeekGrid';
import { YearView } from '@/src/components/calendar/YearView';
import { Screen } from '@/src/components/layout/Screen';
import { useT } from '@/src/i18n';
import { dayKey, expandEvents, groupByDay, monthMatrix, rangeFor, shiftCursor, type Occurrence } from '@/src/lib/calendar-utils';
import { shareICS } from '@/src/lib/ics-export';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { useCalendars, useEvents } from '@/src/services/queries';
import type { CalendarView } from '@/src/theme/types';
import { ErrorCard, LoadingCard } from '@/src/ui/EmptyState';
import { toast } from '@/src/ui/Toast';

type DialogState = { occurrence: Occurrence | null; date: Date } | null;

export default function CalendarScreen() {
  const { prefs } = usePreferences();
  const t = useT();
  const weekStart = prefs.week_start;

  const [view, setView] = useState<CalendarView>(prefs.default_view);
  const [cursor, setCursor] = useState(() => new Date());
  const [detailed, setDetailed] = useState(true);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const range = useMemo(() => rangeFor(view, cursor, weekStart), [view, cursor, weekStart]);
  const eventsQuery = useEvents({ from: range.from.toISOString(), to: range.to.toISOString() });
  const calendars = useCalendars().data ?? [];

  const occurrences = useMemo(() => {
    const expanded = expandEvents(eventsQuery.data, range.from, range.to);
    return activeCategories.length ? expanded.filter((o) => activeCategories.includes(o.category)) : expanded;
  }, [eventsQuery.data, range.from, range.to, activeCategories]);

  const byDay = useMemo(() => groupByDay(occurrences), [occurrences]);
  const weeks = useMemo(() => monthMatrix(cursor, weekStart), [cursor, weekStart]);

  const openEvent = (occ: Occurrence) => setDialog({ occurrence: occ, date: occ.occurrence_start });
  const selectDay = (day: Date) => {
    setCursor(day);
    setView('day');
  };
  const handleShortcut = (id: RangeShortcut) => {
    setCursor(new Date());
    setView(id === 'today' ? 'day' : id === 'week' ? 'week' : id === 'month' ? 'month' : 'agenda');
  };
  const handleExport = () =>
    shareICS(occurrences, `takvimim-${dayKey(new Date())}.ics`).catch(() => toast.error(t('ev.toastErr')));

  return (
    <Screen>
      <Toolbar
        view={view}
        cursor={cursor}
        weekStart={weekStart}
        detailed={detailed}
        onViewChange={setView}
        onShift={(dir) => setCursor((prev) => shiftCursor(view, prev, dir))}
        onToday={() => setCursor(new Date())}
        onRangeShortcut={handleShortcut}
        onToggleDetail={() => setDetailed((d) => !d)}
        onCreate={() => setDialog({ occurrence: null, date: cursor })}
        onQuickAdd={() => setQuickAddOpen(true)}
        onExport={handleExport}
      />

      <CategoryFilter
        active={activeCategories}
        onToggle={(id) => setActiveCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
        onClear={() => setActiveCategories([])}
      />

      {eventsQuery.isPending ? (
        <LoadingCard />
      ) : eventsQuery.isError ? (
        <ErrorCard message={t('load.error')} />
      ) : (
        <>
          {view === 'month' && (
            <MonthGrid
              cursor={cursor}
              weekStart={weekStart}
              weeks={weeks}
              byDay={byDay}
              detailed={detailed}
              density={prefs.density}
              onSelectDay={selectDay}
              onOpenEvent={openEvent}
            />
          )}
          {view === 'week' && (
            <WeekGrid
              cursor={cursor}
              weekStart={weekStart}
              byDay={byDay}
              detailed={detailed}
              density={prefs.density}
              onSelectDay={selectDay}
              onOpenEvent={openEvent}
            />
          )}
          {view === 'day' && (
            <DayView
              cursor={cursor}
              byDay={byDay}
              detailed={detailed}
              onOpenEvent={openEvent}
              onCreate={(date) => setDialog({ occurrence: null, date })}
            />
          )}
          {view === 'year' && (
            <YearView
              cursor={cursor}
              events={eventsQuery.data ?? []}
              onSelectMonth={(month) => {
                setCursor(new Date(cursor.getFullYear(), month, 1));
                setView('month');
              }}
            />
          )}
          {view === 'agenda' && (
            <AgendaView from={range.from} days={35} byDay={byDay} detailed={detailed} onOpenEvent={openEvent} />
          )}
        </>
      )}

      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <EventDialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        occurrence={dialog?.occurrence ?? null}
        defaultDate={dialog?.date ?? cursor}
        calendars={calendars}
      />
    </Screen>
  );
}
