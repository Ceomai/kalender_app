import { Check } from "lucide-react";
import { THEMES } from "@/lib/categories";
import { usePreferences } from "@/lib/PreferencesContext";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { prefs, update } = usePreferences();

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {THEMES.map((t) => {
        const active = (prefs.theme || "aurora") === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => update({ theme: t.id })}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border p-3 text-left transition",
              active ? "border-primary bg-primary/5 shadow-sm" : "border-border/70 hover:bg-accent/50",
            )}
          >
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", t.swatch)}>
              {active ? <Check className="h-4 w-4 text-white" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{t.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{t.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}