import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search } from "lucide-react";
import { listEvents } from "@/lib/event-fns";
import { listCalendars } from "@/lib/calendar-fns";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { PRIORITIES } from "@/lib/categories";
import { addDays, endOfDay, expandEvents, groupByDay, startOfDay } from "@/lib/calendar-utils";
import { CategoryFilter } from "@/components/calendar/CategoryFilter";
import { AgendaView } from "@/components/calendar/AgendaView";
import { EventDialog } from "@/components/calendar/EventDialog";
import { PendingInvitations } from "@/components/calendar/PendingInvitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/hatirlaticilar")({
  head: () => ({ meta: [{ title: "Hatırlatıcılar · Takvimim" }] }),
  component: RemindersPage,
});

const RANGES = [
  { id: 1 },
  { id: 7 },
  { id: 30 },
  { id: 90 },
];

function RemindersPage() {
  const t = useT();
  const { prefs } = usePreferences();
  const weekStart = prefs.week_start || "mon";
  const [activeCategories, setActiveCategories] = useState([]);
  const [priority, setPriority] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rangeDays, setRangeDays] = useState(30);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const from = startOfDay(new Date());
  const to = endOfDay(addDays(from, rangeDays));
  const fromISO = from.toISOString();
  const toISOStr = to.toISOString();

  const fetchEvents = useServerFn(listEvents);
  const fetchCalendars = useServerFn(listCalendars);
  const eventsQuery = useQuery({
    queryKey: ["events", "liste", fromISO, toISOStr, activeCategories.join(","), priority, search],
    queryFn: () =>
      fetchEvents({
        data: {
          from: fromISO,
          to: toISOStr,
          categories: activeCategories.length ? activeCategories : undefined,
          priority: priority === "all" ? undefined : priority,
          search: search || undefined,
        },
      }),
  });
  const calendarsQuery = useQuery({ queryKey: ["calendars"], queryFn: () => fetchCalendars() });

  const occurrences = useMemo(
    () => expandEvents(eventsQuery.data || [], from, to),
    [eventsQuery.data, fromISO, toISOStr],
  );
  const byDay = useMemo(() => groupByDay(occurrences), [occurrences]);

  const toggleCategory = (id) =>
    setActiveCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="animate-fade space-y-5">
      <PendingInvitations />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("rm.eyebrow")}
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{t("rm.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("rm.intro")}</p>
        </div>
        <Button onClick={() => setDialog({ occurrence: null, date: new Date() })}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("rm.new")}
        </Button>
      </div>

      <div className="space-y-3 rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
        <CategoryFilter
          active={activeCategories}
          onToggle={toggleCategory}
          onClear={() => setActiveCategories([])}
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("rm.search")}
              className="pl-9"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setPriority("all")}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                priority === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-accent",
              )}
            >
              {t("rm.allPriorities")}
            </button>
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  priority === p.id ? p.chip : "border-border/60 text-muted-foreground hover:bg-accent",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRangeDays(r.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  rangeDays === r.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 text-muted-foreground hover:bg-accent",
                )}
              >
                {t(`rm.range.${r.id}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {eventsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : eventsQuery.isError ? (
        <p className="rounded-3xl border border-destructive/40 bg-destructive/5 px-5 py-6 text-sm text-destructive">
          {t("rm.error")}
        </p>
      ) : (
        <AgendaView
          from={from}
          days={rangeDays}
          byDay={byDay}
          detailed
          weekStart={weekStart}
          onOpenEvent={(occ) => setDialog({ occurrence: occ, date: occ.occurrence_start })}
        />
      )}

      <EventDialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        occurrence={dialog?.occurrence || null}
        defaultDate={dialog?.date || new Date()}
        calendars={calendarsQuery.data || []}
      />
    </div>
  );
}