import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { rotateInviteCode } from "@/lib/profile-fns";
import { useT } from "@/lib/i18n";
import { SectionCard } from "@/components/common/SectionCard";
import { CodeBox } from "@/components/common/CodeBox";
import { AddFriendByCode } from "@/components/friends/AddFriendByCode";
import { FriendList } from "@/components/friends/FriendList";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authed/arkadaslar")({
  head: () => ({ meta: [{ title: "Arkadaşlar · Takvimim" }] }),
  component: FriendsPage,
});

function FriendsPage() {
  const t = useT();
  const { profile } = Route.useRouteContext();
  const router = useRouter();
  const rotate = useServerFn(rotateInviteCode);

  const rotateMutation = useMutation({
    mutationFn: () => rotate({ data: {} }),
    onSuccess: async () => {
      await router.invalidate();
      toast.success(t("fr.toastRotated"));
    },
  });

  return (
    <div className="animate-fade space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("fr.eyebrow")}
        </p>
        <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{t("fr.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("fr.intro")}</p>
      </div>

      <SectionCard
        title={t("fr.codeTitle")}
        description={t("fr.codeDesc")}
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={rotateMutation.isPending}
            onClick={() => rotateMutation.mutate()}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            {t("fr.refresh")}
          </Button>
        }
      >
        <CodeBox code={profile?.invite_code || "------"} label={t("fr.codeLabel")} />
      </SectionCard>

      <SectionCard title={t("fr.addTitle")}>
        <AddFriendByCode />
      </SectionCard>

      <SectionCard title={t("fr.listTitle")} description={t("fr.listDesc")}>
        <FriendList />
      </SectionCard>
    </div>
  );
}