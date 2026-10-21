import { useState } from "react";
import { CalendarPlus, Users } from "lucide-react";
import { calendarColor } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import { CodeBox } from "@/components/common/CodeBox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarCard({ calendar, isOwner, busy, onLeave, onDelete }) {
  const t = useT();
  const [confirming, setConfirming] = useState(null);
  const color = calendarColor(calendar.color);
  const members = calendar.member_names || [];

  return (
    <article className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
      <header className="flex items-start gap-3">
        <span className={cn("mt-0.5 grid h-10 w-10 place-items-center rounded-2xl", color.dot)}>
          <Users className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-semibold">{calendar.name}</p>
          <p className="text-xs text-muted-foreground">
            {t("cal.card.createdBy").replace("{name}", calendar.owner_name || t("cal.card.founder"))} · {t("cal.card.members").replace("{n}", members.length)}
          </p>
        </div>
        {isOwner && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {t("cal.card.founder")}
          </span>
        )}
      </header>

      {calendar.description && (
        <p className="mt-3 text-sm text-muted-foreground">{calendar.description}</p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t("cal.card.membersLabel")}: {members.length ? members.join(", ") : "—"}
      </p>

      {calendar.invite_code && (
        <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-3">
          <CodeBox code={calendar.invite_code} label={t("cal.card.joinCode")} />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarPlus className="h-3.5 w-3.5" />
            {t("cal.card.shareHint")}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        {confirming ? (
          <>
            <span className="mr-auto text-xs text-muted-foreground">
              {confirming === "delete" ? t("cal.card.deleteConfirm") : t("cal.card.leaveConfirm")}
            </span>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => (confirming === "delete" ? onDelete() : onLeave())}
            >
              {t("cal.card.yes")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
              {t("act.cancel")}
            </Button>
          </>
        ) : isOwner ? (
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setConfirming("delete")}>
            {t("cal.card.deleteBtn")}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setConfirming("leave")}>
            {t("cal.card.leaveBtn")}
          </Button>
        )}
      </div>
    </article>
  );
}