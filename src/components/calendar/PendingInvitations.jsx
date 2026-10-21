import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";
import { listPendingInvitations, respondToInvitation } from "@/lib/invitation-fns";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { formatDateTimeLocal } from "@/lib/calendar-utils";

export function PendingInvitations() {
  const t = useT();
  const queryClient = useQueryClient();
  const list = useServerFn(listPendingInvitations);
  const respond = useServerFn(respondToInvitation);

  const q = useQuery({
    queryKey: ["pending-invitations"],
    queryFn: () => list(),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }) => respond({ data: { invitation_id: id, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => toast.error(t("inv.toastErr")),
  });

  const invitations = q.data || [];

  if (!invitations.length) return null;

  return (
    <div className="mb-4 space-y-2">
      <p className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {t("inv.pending")}
      </p>
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{inv.event_title}</p>
            <p className="text-xs text-muted-foreground">
              {t("inv.from").replace("{name}", inv.inviter_name || "")}
              {inv.event_start ? ` · ${formatDateTimeLocal(inv.event_start)}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={respondMutation.isPending}
              onClick={() => respondMutation.mutate({ id: inv.id, status: "accepted" })}
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              {t("inv.accept")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={respondMutation.isPending}
              onClick={() => respondMutation.mutate({ id: inv.id, status: "tentative" })}
            >
              {t("inv.tentative")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={respondMutation.isPending}
              onClick={() => respondMutation.mutate({ id: inv.id, status: "declined" })}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              {t("inv.decline")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}