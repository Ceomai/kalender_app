import { dayKey, isToday, weekdayLabels } from "@/lib/calendar-utils";
import { EventChip } from "@/components/calendar/EventChip";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MonthGrid({ cursor, weekStart, weeks, byDay, detailed, density, onSelectDay, onOpenEvent }) {
  const t = useT();
  const labels = weekdayLabels(weekStart);
  const limit = detailed ? 2 : 3;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/40">
        {labels.map((l) => (
          <div
            key={l}
            className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {l}
          </div>
        ))}
      </div>
      <div className="divide-y divide-border/60">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-border/60">
            {week.map((day) => {
              const items = byDay.get(dayKey(day)) || [];
              const outside = day.getMonth() !== cursor.getMonth();
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[94px] p-1.5 transition-colors sm:min-h-[124px]",
                    density === "compact" && "sm:min-h-[104px]",
                    outside && "bg-muted/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className={cn(
                      "mb-1 grid h-6 w-6 place-items-center rounded-full text-xs font-semibold transition",
                      isToday(day)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : outside
                          ? "text-muted-foreground/60 hover:bg-accent"
                          : "text-foreground hover:bg-accent",
                    )}
                  >
                    {day.getDate()}
                  </button>
                  <div className="space-y-1">
                    {items.slice(0, limit).map((occ) => (
                      <EventChip
                        key={occ.occurrence_key}
                        occurrence={occ}
                        detailed={detailed}
                        onClick={() => onOpenEvent(occ)}
                      />
                    ))}
                    {items.length > limit && (
                      <button
                        type="button"
                        onClick={() => onSelectDay(day)}
                        className="w-full truncate rounded-lg px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-accent"
                      >
                        +{items.length - limit} {t("time.records")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}