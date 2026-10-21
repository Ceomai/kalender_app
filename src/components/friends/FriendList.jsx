import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Users } from "lucide-react";
import { listFriends, removeFriend } from "@/lib/friend-fns";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function FriendList() {
  const t = useT();
  const queryClient = useQueryClient();
  const fetchFriends = useServerFn(listFriends);
  const remove = useServerFn(removeFriend);
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => fetchFriends(),
  });

  const mutation = useMutation({
    mutationFn: (id) => remove({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success(t("fr.list.removed"));
    },
  });

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (friends.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
        <p className="font-heading text-sm font-semibold">{t("fr.list.empty")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("fr.list.emptyDesc")}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {friends.map((f) => (
        <li key={f.id} className="flex items-center gap-3 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{f.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("fr.list.addedOn").replace("{date}", new Date(f.created_date).toLocaleDateString(t.lang === "en" ? "en-US" : "tr-TR"))}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("fr.list.remove")}
            onClick={() => mutation.mutate(f.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </li>
      ))}
    </ul>
  );
}