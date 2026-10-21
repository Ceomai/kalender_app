import { dayKey, formatDayLong, isToday } from "@/lib/calendar-utils";
import { EventRow } from "@/components/calendar/EventRow";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AgendaView({ from, days, byDay, detailed, weekStart, onOpenEvent }) {
  const t = useT();
  const list = Array.from({ length: days }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return d;
  });
  const filled = list.filter((d) => (byDay.get(dayKey(d)) || []).length > 0);

  if (filled.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <p className="font-heading text-base font-semibold">{t("agenda.empty")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("agenda.emptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {filled.map((day) => {
        const items = byDay.get(dayKey(day)) || [];
        return (
          <section key={day.toISOString()} className="space-y-2">
            <div className="flex items-center gap-3 px-1">
              <p
                className={cn(
                  "font-heading text-sm font-semibold",
                  isToday(day) && "text-primary",
                )}
              >
                {formatDayLong(day)}
              </p>
              {isToday(day) && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {t("agenda.today")}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {items.length} {t("time.records")}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((occ) => (
                <EventRow
                  key={occ.occurrence_key}
                  occurrence={occ}
                  detailed={detailed}
                  onClick={() => onOpenEvent(occ)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}