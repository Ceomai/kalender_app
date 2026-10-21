import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEvents } from "@/lib/event-fns";
import { listCalendars } from "@/lib/calendar-fns";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { dayKey, expandEvents, groupByDay, monthMatrix, rangeFor } from "@/lib/calendar-utils";
import { Toolbar } from "@/components/calendar/Toolbar";
import { CategoryFilter } from "@/components/calendar/CategoryFilter";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekGrid } from "@/components/calendar/WeekGrid";
import { DayView } from "@/components/calendar/DayView";
import { AgendaView } from "@/components/calendar/AgendaView";
import { YearView } from "@/components/calendar/YearView";
import { EventDialog } from "@/components/calendar/EventDialog";
import { QuickAddDialog } from "@/components/calendar/QuickAddDialog";
import { downloadICS } from "@/lib/ics-export";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Takvim · Takvimim" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { prefs } = usePreferences();
  const t = useT();
  const weekStart = prefs.week_start || "mon";
  const density = prefs.density || "comfortable";

  const [view, setView] = useState(() => prefs.default_view || "month");
  const [cursor, setCursor] = useState(() => new Date());
  const [detailed, setDetailed] = useState(true);
  const [activeCategories, setActiveCategories] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const range = useMemo(() => rangeFor(view, cursor, weekStart), [view, cursor, weekStart]);
  const fromISO = range.from.toISOString();
  const toISOStr = range.to.toISOString();

  const fetchEvents = useServerFn(listEvents);
  const fetchCalendars = useServerFn(listCalendars);

  const eventsQuery = useQuery({
    queryKey: ["events", fromISO, toISOStr],
    queryFn: () => fetchEvents({ data: { from: fromISO, to: toISOStr } }),
  });
  const calendarsQuery = useQuery({ queryKey: ["calendars"], queryFn: () => fetchCalendars() });

  const occurrences = useMemo(() => {
    const expanded = expandEvents(eventsQuery.data || [], range.from, range.to);
    return activeCategories.length
      ? expanded.filter((o) => activeCategories.includes(o.category))
      : expanded;
  }, [eventsQuery.data, range.from, range.to, activeCategories]);

  const byDay = useMemo(() => groupByDay(occurrences), [occurrences]);
  const weeks = useMemo(() => monthMatrix(cursor, weekStart), [cursor, weekStart]);

  const openEvent = (occ) => setDialog({ occurrence: occ, date: occ.occurrence_start });
  const selectDay = (day) => {
    setCursor(day);
    setView("day");
  };
  const handleShortcut = (id) => {
    setCursor(new Date());
    setView(id === "today" ? "day" : id === "week" ? "week" : id === "month" ? "month" : "agenda");
  };
  const selectMonth = (month) => {
    setCursor(new Date(cursor.getFullYear(), month, 1));
    setView("month");
  };
  const handleExport = () => {
    downloadICS(occurrences, `takvimim-${dayKey(new Date())}.ics`);
  };
  const toggleCategory = (id) =>
    setActiveCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="animate-fade space-y-5">
      <Toolbar
        view={view}
        cursor={cursor}
        weekStart={weekStart}
        detailed={detailed}
        onViewChange={setView}
        onShift={(dir) => setCursor((prev) => {
          if (view === "day") prev.setDate(prev.getDate() + dir);
          else if (view === "week") prev.setDate(prev.getDate() + 7 * dir);
          else if (view === "agenda") prev.setDate(prev.getDate() + 30 * dir);
          else if (view === "year") prev.setFullYear(prev.getFullYear() + dir);
          else {
            prev.setDate(1);
            prev.setMonth(prev.getMonth() + dir);
          }
          return new Date(prev);
        })}
        onToday={() => setCursor(new Date())}
        onRangeShortcut={handleShortcut}
        onDetailChange={(next) => setDetailed(next === "detailed")}
        onCreate={() => setDialog({ occurrence: null, date: cursor })}
        onQuickAdd={() => setQuickAddOpen(true)}
        onExport={handleExport}
      />

      <CategoryFilter
        active={activeCategories}
        onToggle={toggleCategory}
        onClear={() => setActiveCategories([])}
      />

      {eventsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : eventsQuery.isError ? (
        <p className="rounded-3xl border border-destructive/40 bg-destructive/5 px-5 py-6 text-sm text-destructive">
          {t("load.error")}
        </p>
      ) : (
        <>
          {view === "month" && (
            <MonthGrid
              cursor={cursor}
              weekStart={weekStart}
              weeks={weeks}
              byDay={byDay}
              detailed={detailed}
              density={density}
              onSelectDay={selectDay}
              onOpenEvent={openEvent}
            />
          )}
          {view === "week" && (
            <WeekGrid
              cursor={cursor}
              weekStart={weekStart}
              byDay={byDay}
              detailed={detailed}
              density={density}
              onSelectDay={selectDay}
              onOpenEvent={openEvent}
            />
          )}
          {view === "day" && (
            <DayView
              cursor={cursor}
              byDay={byDay}
              detailed={detailed}
              onOpenEvent={openEvent}
              onCreate={(date) => setDialog({ occurrence: null, date })}
            />
          )}
          {view === "year" && (
            <YearView
              cursor={cursor}
              events={eventsQuery.data || []}
              onSelectMonth={selectMonth}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              from={range.from}
              days={35}
              byDay={byDay}
              detailed={detailed}
              weekStart={weekStart}
              onOpenEvent={openEvent}
            />
          )}
        </>
      )}

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      <EventDialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        occurrence={dialog?.occurrence || null}
        defaultDate={dialog?.date || cursor}
        calendars={calendarsQuery.data || []}
      />
    </div>
  );
}