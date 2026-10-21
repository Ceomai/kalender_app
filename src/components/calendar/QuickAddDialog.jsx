import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Calendar, CheckSquare, Clock, MapPin, Sparkles, Tag } from "lucide-react";
import { parseQuickAdd } from "@/lib/quick-add";
import { toISO, dateInputValue } from "@/lib/calendar-utils";
import { createEvent } from "@/lib/event-fns";
import { createTask } from "@/lib/task-fns";
import { PRIORITIES, categoryOf, priorityOf } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Doğal dil ile hızlı ekleme: metni yazdıkça canlı önizleme gösterir, etkinlik
// veya görev oluşturur.
export function QuickAddDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const create = useServerFn(createEvent);
  const createT = useServerFn(createTask);
  const [text, setText] = useState("");
  const t = useT();

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const parsed = useMemo(() => parseQuickAdd(text), [text]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error(t("qa.needText"));
      if (parsed.type === "task") {
        return createT({
          data: {
            title: parsed.title,
            priority: parsed.priority || "medium",
            due_date: parsed.dueDate || null,
          },
        });
      }
      const today = new Date();
      const dateOnly = parsed.date || dateInputValue(today);
      const startTime = parsed.isAllDay ? "09:00" : parsed.startTime || "09:00";
      return create({
        data: {
          title: parsed.title,
          start_at: toISO(dateOnly, startTime),
          end_at: parsed.endTime ? toISO(dateOnly, parsed.endTime) : null,
          all_day: parsed.isAllDay,
          category: "personal",
          priority: parsed.priority || "medium",
          location: parsed.location || "",
          repeat: "none",
          reminder_minutes: [30],
          email_reminder: false,
          calendar_id: null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-reminders"] });
      toast.success(parsed?.type === "task" ? t("qa.toastTask") : t("qa.toastEvent"));
      onOpenChange(false);
    },
    onError: () => toast.error(t("qa.toastErr")),
  });

  const cat = categoryOf("personal");
  const prio = parsed?.priority ? priorityOf(parsed.priority) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("qa.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("qa.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && parsed) saveMutation.mutate();
            }}
          />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{t("qa.tips")}</span> {t("qa.tipsBody")}
          </p>

          {parsed && (
            <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    parsed.type === "task"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : cat.chip,
                  )}
                >
                  {parsed.type === "task" ? <CheckSquare className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                  {parsed.type === "task" ? t("qa.task") : t("qa.event")}
                </span>
                {prio && (
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", prio.chip)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", prio.dot)} />
                    {prio.label}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{parsed.title}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {parsed.date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {parsed.date}
                  </span>
                )}
                {parsed.startTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {parsed.startTime}
                    {parsed.endTime ? ` – ${parsed.endTime}` : ""}
                  </span>
                )}
                {parsed.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {parsed.location}
                  </span>
                )}
                {parsed.isAllDay && parsed.type === "event" && (
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> {t("time.allDay")}
                  </span>
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!parsed || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t("act.adding") : t("act.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}