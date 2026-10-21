import { categoryOf, priorityOf } from "@/lib/categories";
import { formatTimePref } from "@/lib/calendar-utils";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Tek bir takvim kaydının görünümü: genel (kısa) veya detaylı.
export function EventChip({ occurrence, detailed, onClick }) {
  const { prefs } = usePreferences();
  const t = useT();
  const cat = categoryOf(occurrence.category);
  const prio = priorityOf(occurrence.priority);
  const time = occurrence.all_day ? t("time.allDay") : formatTimePref(occurrence.occurrence_start, prefs.time_format);
  const Icon = cat.icon;

  if (!detailed) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`${time} · ${occurrence.title}`}
        className={cn(
          "flex w-full items-center gap-1.5 truncate rounded-lg border px-1.5 py-1 text-left text-[11px] font-medium transition hover:brightness-[0.97]",
          cat.chip,
          occurrence.done && "line-through opacity-60",
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", prio.dot)} />
        <span className="truncate">{occurrence.title}</span>
        {occurrence.repeat && occurrence.repeat !== "none" && <span className="shrink-0 opacity-70">↻</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-xl border px-2 py-1.5 text-left transition hover:brightness-[0.97]",
        cat.chip,
        occurrence.done && "opacity-60",
      )}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
        <Icon className="h-3 w-3" />
        {time}
        <span className={cn("ml-auto h-1.5 w-1.5 rounded-full", prio.dot)} />
      </span>
      <span className={cn("truncate text-xs font-medium", occurrence.done && "line-through")}>
        {occurrence.title}
      </span>
      {occurrence.calendar_name && (
        <span className="truncate text-[10px] opacity-70">{occurrence.calendar_name}</span>
      )}
    </button>
  );
}