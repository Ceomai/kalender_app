import { CATEGORIES } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CategoryFilter({ active, onToggle, onClear }) {
  const t = useT();
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        onClick={onClear}
        className={cn(
          "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
          active.length === 0
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/70 text-muted-foreground hover:bg-accent",
        )}
      >
        {t("cf.all")}
      </button>
      {CATEGORIES.map((c) => {
        const Icon = c.icon;
        const on = active.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              on ? c.chip : "border-border/60 text-muted-foreground hover:bg-accent",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}