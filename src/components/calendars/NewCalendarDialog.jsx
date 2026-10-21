import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CALENDAR_COLORS } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import { createCalendar } from "@/lib/calendar-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewCalendarDialog({ open, onOpenChange }) {
  const t = useT();
  const queryClient = useQueryClient();
  const create = useServerFn(createCalendar);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("violet");

  const mutation = useMutation({
    mutationFn: () => create({ data: { name: name.trim(), description: description.trim(), color } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      toast.success(t("ndlg.toastCreated"));
      setName("");
      setDescription("");
      setColor("violet");
      onOpenChange(false);
    },
    onError: () => toast.error(t("ndlg.toastErr")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{t("ndlg.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cal-name">{t("ndlg.name")}</Label>
            <Input
              id="cal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("ndlg.namePh")}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cal-desc">{t("ndlg.desc")}</Label>
            <Textarea
              id="cal-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("ndlg.descPh")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("ndlg.color")}</Label>
            <div className="flex flex-wrap gap-2">
              {CALENDAR_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  aria-label={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 transition",
                    c.dot,
                    color === c.id ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("act.cancel")}
          </Button>
          <Button disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? t("ndlg.creating") : t("ndlg.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}