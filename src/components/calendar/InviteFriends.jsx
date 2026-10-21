import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { UserPlus, Check } from "lucide-react";
import { listFriends } from "@/lib/friend-fns";
import { inviteToEvent, listEventInvitations } from "@/lib/invitation-fns";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  declined: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  tentative: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

export function InviteFriends({ eventId }) {
  const t = useT();
  const queryClient = useQueryClient();
  const getFriends = useServerFn(listFriends);
  const getInvitations = useServerFn(listEventInvitations);
  const invite = useServerFn(inviteToEvent);
  const [selected, setSelected] = useState(new Set());

  const friendsQ = useQuery({
    queryKey: ["friends-for-invite"],
    queryFn: () => getFriends(),
    enabled: !!eventId,
  });

  const invitationsQ = useQuery({
    queryKey: ["event-invitations", eventId],
    queryFn: () => getInvitations({ data: { event_id: eventId } }),
    enabled: !!eventId,
  });

  useEffect(() => {
    setSelected(new Set());
  }, [eventId]);

  const inviteMutation = useMutation({
    mutationFn: (ids) => invite({ data: { event_id: eventId, friend_ids: ids } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(t("inv.errNoFriends"));
        return;
      }
      toast.success(t("inv.toastSent").replace("{n}", res.created || 0));
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["event-invitations", eventId] });
    },
    onError: () => toast.error(t("inv.toastErr")),
  });

  const friends = friendsQ.data || [];
  const invitations = invitationsQ.data || [];
  const invitedMap = new Map(invitations.map((i) => [i.invitee_id, i.status]));

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInvite = () => {
    if (!selected.size) return;
    inviteMutation.mutate(Array.from(selected));
  };

  if (!friends.length) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
        {t("inv.noFriends")}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {friends.map((f) => {
          const status = invitedMap.get(f.friend_id);
          const isSelected = selected.has(f.friend_id);
          const alreadyInvited = !!status;
          return (
            <button
              key={f.friend_id}
              type="button"
              disabled={alreadyInvited}
              onClick={() => toggle(f.friend_id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                alreadyInvited
                  ? "border-transparent bg-muted text-muted-foreground"
                  : isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 text-muted-foreground hover:bg-accent",
              )}
            >
              {alreadyInvited ? (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", STATUS_STYLE[status])}>
                  {t(`inv.status.${status}`)}
                </span>
              ) : isSelected ? (
                <Check className="h-3 w-3" />
              ) : null}
              {f.name}
            </button>
          );
        })}
      </div>
      {selected.size > 0 && (
        <Button type="button" size="sm" disabled={inviteMutation.isPending} onClick={handleInvite}>
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          {inviteMutation.isPending ? t("inv.sending") : t("inv.send").replace("{n}", selected.size)}
        </Button>
      )}
    </div>
  );
}