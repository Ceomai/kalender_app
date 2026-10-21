import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  deleteCalendar,
  joinCalendarByCode,
  leaveCalendar,
  listCalendars,
} from "@/lib/calendar-fns";
import { useT } from "@/lib/i18n";
import { SectionCard } from "@/components/common/SectionCard";
import { CalendarCard } from "@/components/calendars/CalendarCard";
import { NewCalendarDialog } from "@/components/calendars/NewCalendarDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/takvimler")({
  head: () => ({ meta: [{ title: "Ortak Takvimler · Takvimim" }] }),
  component: CalendarsPage,
});

function CalendarsPage() {
  const t = useT();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const fetchCalendars = useServerFn(listCalendars);
  const join = useServerFn(joinCalendarByCode);
  const leave = useServerFn(leaveCalendar);
  const removeCalendar = useServerFn(deleteCalendar);

  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: calendars = [], isLoading } = useQuery({
    queryKey: ["calendars"],
    queryFn: () => fetchCalendars(),
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["calendars"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  const joinMutation = useMutation({
    mutationFn: () => join({ data: { code: code.trim() } }),
    onSuccess: (res) => {
      if (res.ok) {
        setCode("");
        setFeedback({ ok: true, text: t("cal.joined") });
        refreshAll();
      } else {
        setFeedback({
          ok: false,
          text:
            res.reason === "not_found"
              ? t("cal.notFound")
              : res.reason === "already"
                ? t("cal.already")
                : t("cal.joinFail"),
        });
      }
    },
    onError: () => setFeedback({ ok: false, text: t("cal.joinFailRetry") }),
  });

  const leaveMutation = useMutation({
    mutationFn: (id) => leave({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.removed ? t("cal.deletedToast") : t("cal.left"));
        refreshAll();
      } else {
        toast.error(t("cal.fail"));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => removeCalendar({ data: { id } }),
    onSuccess: () => {
      toast.success(t("cal.deletedToast"));
      refreshAll();
    },
  });

  const busy = leaveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="animate-fade space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("cal.eyebrow")}
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{t("cal.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("cal.intro")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("cal.new")}
        </Button>
      </div>

      <SectionCard
        title={t("cal.joinTitle")}
        description={t("cal.joinDesc")}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setFeedback(null);
            }}
            placeholder={t("cal.codePh")}
            className="font-mono tracking-[0.15em]"
            maxLength={12}
            autoComplete="off"
          />
          <Button
            disabled={code.trim().length < 4 || joinMutation.isPending}
            onClick={() => joinMutation.mutate()}
          >
            {joinMutation.isPending ? t("cal.joining") : t("cal.join")}
          </Button>
        </div>
        {feedback && (
          <p
            className={cn(
              "mt-3 rounded-xl px-3 py-2 text-xs",
              feedback.ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive",
            )}
          >
            {feedback.text}
          </p>
        )}
      </SectionCard>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : calendars.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
          <p className="font-heading text-base font-semibold">{t("cal.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("cal.emptyDesc")}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {calendars.map((cal) => (
            <CalendarCard
              key={cal.id}
              calendar={cal}
              isOwner={cal.owner_id === user.id}
              busy={busy}
              onLeave={() => leaveMutation.mutate(cal.id)}
              onDelete={() => deleteMutation.mutate(cal.id)}
            />
          ))}
        </div>
      )}

      <NewCalendarDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}