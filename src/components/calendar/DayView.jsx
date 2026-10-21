import { dayKey, formatDayLong } from "@/lib/calendar-utils";
import { EventRow } from "@/components/calendar/EventRow";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function DayView({ cursor, byDay, detailed, onOpenEvent, onCreate }) {
  const t = useT();
  const items = byDay.get(dayKey(cursor)) || [];
  const allDay = items.filter((o) => o.all_day);
  const timed = items.filter((o) => !o.all_day);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/70 bg-card px-4 py-3 shadow-sm">
        <p className="font-heading text-xl font-semibold">{formatDayLong(cursor)}</p>
        <Button size="sm" variant="outline" onClick={() => onCreate(cursor)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("day.add")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
          <p className="font-heading text-base font-semibold">{t("day.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("day.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allDay.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("day.allDaySection")}
              </p>
              {allDay.map((occ) => (
                <EventRow
                  key={occ.occurrence_key}
                  occurrence={occ}
                  detailed={detailed}
                  onClick={() => onOpenEvent(occ)}
                />
              ))}
            </section>
          )}
          {timed.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("day.timedSection")}
              </p>
              {timed.map((occ) => (
                <EventRow
                  key={occ.occurrence_key}
                  occurrence={occ}
                  detailed={detailed}
                  onClick={() => onOpenEvent(occ)}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}