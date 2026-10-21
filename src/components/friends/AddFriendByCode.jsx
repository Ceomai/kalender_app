import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus } from "lucide-react";
import { addFriendByCode } from "@/lib/friend-fns";
import { useT } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REASON_KEYS = {
  not_found: "fr.add.notFound",
  self: "fr.add.self",
  exists: "fr.add.exists",
};

export function AddFriendByCode({ onAdded }) {
  const t = useT();
  const queryClient = useQueryClient();
  const add = useServerFn(addFriendByCode);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);

  const mutation = useMutation({
    mutationFn: () => add({ data: { code: code.trim() } }),
    onSuccess: (res) => {
      if (res.ok) {
        setCode("");
        setFeedback({ ok: true, text: t("fr.add.ok").replace("{name}", res.friend.name) });
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        onAdded?.();
      } else {
        setFeedback({ ok: false, text: (REASON_KEYS[res.reason] && t(REASON_KEYS[res.reason])) || t("fr.add.fail") });
      }
    },
    onError: () => setFeedback({ ok: false, text: t("fr.add.failRetry") }),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setFeedback(null);
          }}
          placeholder={t("fr.add.ph")}
          className="font-mono tracking-[0.15em]"
          maxLength={12}
          autoComplete="off"
        />
        <Button
          disabled={code.trim().length < 4 || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="sm:w-auto"
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          {mutation.isPending ? t("fr.add.adding") : t("fr.add.btn")}
        </Button>
      </div>
      {feedback && (
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-xs",
            feedback.ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive",
          )}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}