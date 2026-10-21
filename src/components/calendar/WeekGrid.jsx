import { addDays, dayKey, formatDateShort, isToday, startOfWeek, weekdayLabels } from "@/lib/calendar-utils";
import { EventChip } from "@/components/calendar/EventChip";
import { cn } from "@/lib/utils";

export function WeekGrid({ cursor, weekStart, byDay, detailed, density, onSelectDay, onOpenEvent }) {
  const start = startOfWeek(cursor, weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const labels = weekdayLabels(weekStart);

  return (
    <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="grid min-w-[640px] grid-cols-7 gap-2">
        {days.map((day, i) => {
          const items = byDay.get(dayKey(day)) || [];
          return (
            <div key={day.toISOString()} className="flex min-h-[320px] flex-col">
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  "mb-2 rounded-2xl px-2 py-1.5 text-center transition",
                  isToday(day) ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {labels[i]}
                </span>
                <span className="font-heading text-lg font-semibold leading-tight">{day.getDate()}</span>
              </button>
              <div
                className={cn(
                  "flex-1 space-y-1 overflow-y-auto rounded-2xl bg-muted/25 p-1.5",
                  density === "compact" ? "max-h-[300px]" : "max-h-[420px]",
                )}
              >
                {items.length === 0 ? (
                  <p className="px-1 py-3 text-center text-[11px] text-muted-foreground">—</p>
                ) : (
                  items.map((occ) => (
                    <EventChip
                      key={occ.occurrence_key}
                      occurrence={occ}
                      detailed={detailed}
                      onClick={() => onOpenEvent(occ)}
                    />
                  ))
                )}
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                {formatDateShort(day)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}