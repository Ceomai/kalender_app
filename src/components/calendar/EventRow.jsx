import { categoryOf } from "@/lib/categories";
import { formatTimePref } from "@/lib/calendar-utils";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Ajanda ve liste görünümlerinde tek satır.
export function EventRow({ occurrence, detailed, onClick }) {
  const { prefs } = usePreferences();
  const t = useT();
  const cat = categoryOf(occurrence.category);
  const Icon = cat.icon;
  const time = occurrence.all_day ? t("time.allDay") : formatTimePref(occurrence.occurrence_start, prefs.time_format);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-left transition hover:border-border hover:bg-accent/40"
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl border", cat.chip)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-medium", occurrence.done && "line-through opacity-60")}>
            {occurrence.title}
          </span>
          {occurrence.repeat && occurrence.repeat !== "none" && (
            <span className="shrink-0 text-xs text-muted-foreground">↻</span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{time}</span>
          <span>· {cat.label}</span>
          {detailed && occurrence.location && <span>· {occurrence.location}</span>}
          {detailed && occurrence.calendar_name && <span>· {occurrence.calendar_name}</span>}
          {detailed && occurrence.description && (
            <span className="line-clamp-1 max-w-full">· {occurrence.description}</span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground opacity-0 transition group-hover:opacity-100">
        {t("act.open")}
      </span>
    </button>
  );
}