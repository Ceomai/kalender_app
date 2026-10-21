import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  ListFilter,
  MoreHorizontal,
  Plus,
  Rows3,
  Sparkles,
  Zap,
} from "lucide-react";
import { VIEWS, rangeTitle } from "@/lib/calendar-utils";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const RANGE_SHORTCUTS = [
  { id: "today", label: "Bugün" },
  { id: "week", label: "Bu hafta" },
  { id: "month", label: "Bu ay" },
  { id: "quarter", label: "3 ay" },
];

export function Toolbar({
  view,
  cursor,
  weekStart,
  detailed,
  onViewChange,
  onShift,
  onToday,
  onRangeShortcut,
  onDetailChange,
  onCreate,
  onQuickAdd,
  onExport,
}) {
  const t = useT();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("brand")}
          </p>
          <h1 className="truncate font-heading text-3xl font-semibold leading-tight sm:text-4xl">
            {rangeTitle(view, cursor, weekStart)}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" aria-label={t("act.prev")} onClick={() => onShift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            {t("act.today")}
          </Button>
          <Button variant="outline" size="icon" aria-label={t("act.next")} onClick={() => onShift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onQuickAdd} className="gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">{t("act.quick")}</span>
          </Button>
          <Button size="sm" className="ml-1" onClick={() => onCreate()}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("act.new")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-full border border-border/70 bg-card/70 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                view === v.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onDetailChange(detailed ? "compact" : "detailed")}
          className="flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-semibold transition hover:bg-accent"
        >
          {detailed ? <Rows3 className="h-3.5 w-3.5" /> : <ListFilter className="h-3.5 w-3.5" />}
          {detailed ? t("act.detailed") : t("act.simple")}
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {RANGE_SHORTCUTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onRangeShortcut(s.id)}
              className="shrink-0 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-border hover:bg-accent hover:text-accent-foreground"
            >
              {t(`range.${s.id}`)}
            </button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-auto flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-semibold transition hover:bg-accent"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("act.more")}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/analiz" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> {t("toolbar.analysis")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/sablonlar" className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> {t("toolbar.templates")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" /> {t("act.export")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}