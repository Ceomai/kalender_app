import { CATEGORIES, REMINDER_OPTIONS } from "@/lib/categories";
import { LANGUAGES, useT } from "@/lib/i18n";
import { usePreferences } from "@/lib/PreferencesContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Yoğunluk, hafta başlangıcı, varsayılan hatırlatma ve kategori seçimleri.
export function PreferencePanel() {
  const { prefs, update } = usePreferences();
  const t = useT();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t("pp.language")}</p>
          <p className="text-xs text-muted-foreground">{t("pp.languageDesc")}</p>
        </div>
        <div className="flex items-center rounded-full border border-border/70 p-1">
          {LANGUAGES.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => update({ language: o.id })}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition",
                (prefs.language || "tr") === o.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t("pp.density")}</p>
          <p className="text-xs text-muted-foreground">{t("pp.densityDesc")}</p>
        </div>
        <div className="flex items-center rounded-full border border-border/70 p-1">
          {[
            { id: "comfortable", label: t("pp.density.comf") },
            { id: "compact", label: t("pp.density.compact") },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => update({ density: o.id })}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition",
                prefs.density === o.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t("pp.weekStart")}</p>
          <p className="text-xs text-muted-foreground">{t("pp.weekStartDesc")}</p>
        </div>
        <div className="flex items-center rounded-full border border-border/70 p-1">
          {[
            { id: "mon", label: t("pp.weekStart.mon") },
            { id: "sun", label: t("pp.weekStart.sun") },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => update({ week_start: o.id })}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition",
                prefs.week_start === o.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t("pp.defaultView")}</p>
          <p className="text-xs text-muted-foreground">{t("pp.defaultViewDesc")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center rounded-full border border-border/70 p-1">
          {[
            { id: "month", label: t("view.month") },
            { id: "week", label: t("view.week") },
            { id: "day", label: t("view.day") },
            { id: "agenda", label: t("view.agenda") },
            { id: "year", label: t("view.year") },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => update({ default_view: o.id })}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition",
                prefs.default_view === o.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t("pp.timeFormat")}</p>
          <p className="text-xs text-muted-foreground">{t("pp.timeFormatDesc")}</p>
        </div>
        <div className="flex items-center rounded-full border border-border/70 p-1">
          {[
            { id: "24h", label: t("pp.timeFormat.24") },
            { id: "12h", label: t("pp.timeFormat.12") },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => update({ time_format: o.id })}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition",
                prefs.time_format === o.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("pp.defaultReminder")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {REMINDER_OPTIONS.map((o) => (
            <button
              key={o.minutes}
              type="button"
              onClick={() => update({ default_reminder_minutes: o.minutes })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                prefs.default_reminder_minutes === o.minutes
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-accent",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("pp.defaultCategory")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const on = prefs.default_category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => update({ default_category: c.id })}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  on ? c.chip : "border-border/60 text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
        <div>
          <p className="text-sm font-medium">{t("pp.emailReminders")}</p>
          <p className="text-xs text-muted-foreground">{t("pp.emailRemindersDesc")}</p>
        </div>
        <Switch
          checked={!!prefs.email_reminders}
          onCheckedChange={(v) => update({ email_reminders: v })}
        />
      </div>
    </div>
  );
}