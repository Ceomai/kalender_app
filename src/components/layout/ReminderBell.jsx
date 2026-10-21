import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { listUpcoming } from "@/lib/event-fns";
import { countdown, formatDateShort, formatTimePref, reminderTime } from "@/lib/calendar-utils";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { categoryOf } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ReminderBell() {
  const [open, setOpen] = useState(false);
  const { prefs } = usePreferences();
  const t = useT();
  const fetchUpcoming = useServerFn(listUpcoming);
  const { data } = useQuery({
    queryKey: ["upcoming-reminders"],
    queryFn: () => fetchUpcoming({ data: { days: 7 } }),
    refetchInterval: 120000,
  });
  const events = data || [];
  const shown = useRef(new Set());

  // Hatırlatma zamanı gelen kayıtlar için uygulama içi bildirim.
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      events.forEach((ev) => {
        const key = `${ev.id}-${ev.start_at}`;
        const startMs = new Date(ev.start_at).getTime();
        const due = reminderTime(ev).getTime() <= now;
        const notStale = startMs > now - 30 * 60 * 1000;
        if (due && notStale && !shown.current.has(key)) {
          shown.current.add(key);
          toast(ev.title, {
            description: `${formatTimePref(new Date(ev.start_at), prefs.time_format)} · ${t("rb.toastTime")}`,
          });
        }
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [events]);

  const soon = events.filter((ev) => new Date(ev.start_at).getTime() - Date.now() < 86400000);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("rb.aria")} className="relative">
          <Bell className="h-5 w-5" />
          {soon.length > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {soon.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <p className="font-heading text-sm font-semibold">{t("rb.title")}</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {events.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("rb.empty")}
            </p>
          ) : (
            events.map((ev) => {
              const cat = categoryOf(ev.category);
              const Icon = cat.icon;
              const start = new Date(ev.start_at);
              return (
                <div key={ev.id} className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0">
                  <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${cat.chip}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(start)} · {ev.all_day ? t("time.allDay") : formatTimePref(start, prefs.time_format)} ·{" "}
                      {countdown(start)}
                    </p>
                    {ev.calendar_name && (
                      <p className="text-xs text-muted-foreground">{ev.calendar_name}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}