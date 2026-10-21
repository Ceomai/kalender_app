import { monthName, dayKey, isToday } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

const MINI_WEEKDAYS = ["P", "S", "Ç", "P", "C", "C", "P"];

// 12 aylık genel bakım: her ayın mini takvimi ve etkinlik sayısı rozeti.
export function YearView({ cursor, events, onSelectMonth }) {
  const year = cursor.getFullYear();
  const monthCounts = Array.from({ length: 12 }, (_, m) => 0);
  const monthDayKeys = Array.from({ length: 12 }, () => new Set());

  for (const ev of events || []) {
    const d = new Date(ev.start_at);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
    const m = d.getMonth();
    monthCounts[m] += 1;
    monthDayKeys[m].add(dayKey(d));
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }, (_, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const todayInMonth = new Date().getFullYear() === year && new Date().getMonth() === month;
        return (
          <button
            key={month}
            type="button"
            onClick={() => onSelectMonth(month)}
            className="animate-fade rounded-2xl border border-border/70 bg-card p-3 text-left transition hover:border-primary/50 hover:shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  "text-sm font-semibold",
                  todayInMonth ? "text-primary" : "text-foreground",
                )}
              >
                {monthName(month)}
              </span>
              {monthCounts[month] > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {monthCounts[month]}
                </span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {MINI_WEEKDAYS.map((d, i) => (
                <span key={i} className="text-center text-[8px] font-medium text-muted-foreground/70">
                  {d}
                </span>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <span key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                const has = monthDayKeys[month].has(dayKey(date));
                const today = isToday(date);
                return (
                  <span
                    key={day}
                    className={cn(
                      "grid aspect-square place-items-center rounded-full text-[9px]",
                      today
                        ? "bg-primary font-bold text-primary-foreground"
                        : has
                          ? "bg-primary/15 font-medium text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}