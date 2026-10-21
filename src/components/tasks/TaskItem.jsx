import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { priorityOf } from "@/lib/categories";
import { monthName } from "@/lib/calendar-utils";
import { tRaw, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function dueLabel(dueStr) {
  if (!dueStr) return null;
  const d = new Date(dueStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return { text: tRaw("ti.today"), overdue: false };
  if (diff === 1) return { text: tRaw("ti.tomorrow"), overdue: false };
  if (diff < 0) return { text: tRaw("ti.overdue").replace("{n}", Math.abs(diff)), overdue: true };
  return { text: `${d.getDate()} ${monthName(d.getMonth()).slice(0, 3)}`, overdue: false };
}

// Tek bir görev satırı.
export function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const t = useT();
  const prio = priorityOf(task.priority);
  const due = dueLabel(task.due_date);
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 transition hover:shadow-sm",
        task.completed && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="mt-0.5 shrink-0"
        aria-label={task.completed ? t("ti.completed") : t("ti.incomplete")}
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/60 transition hover:text-primary" />
        )}
      </button>

      <div className="min-w-0 flex-1" onClick={onEdit} role="button" tabIndex={-1}>
        <p className={cn("text-sm font-medium leading-snug", task.completed && "line-through")}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", prio.chip)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", prio.dot)} />
            {prio.label}
          </span>
          {due && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                due.overdue && !task.completed
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-border/60 text-muted-foreground",
              )}
            >
              {due.text}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent" aria-label={t("ti.edit")}>
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={t("act.delete")}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}