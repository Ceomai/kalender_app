import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PRIORITIES, priorityOf } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import { createTask, updateTask } from "@/lib/task-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const empty = { title: "", description: "", priority: "medium", due_date: "" };

// Görev oluşturma/düzenleme formu.
export function TaskDialog({ open, onOpenChange, task }) {
  const t = useT();
  const queryClient = useQueryClient();
  const create = useServerFn(createTask);
  const update = useServerFn(updateTask);
  const editing = !!task;
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      task
        ? {
            title: task.title || "",
            description: task.description || "",
            priority: task.priority || "medium",
            due_date: task.due_date ? String(task.due_date).slice(0, 10) : "",
          }
        : empty,
    );
  }, [open, task]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? update({ data: { id: task.id, ...payload } }) : create({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(editing ? t("td.toastUpdated") : t("td.toastCreated"));
      onOpenChange(false);
    },
    onError: () => toast.error(t("td.toastErr")),
  });

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    saveMutation.mutate({
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      due_date: form.due_date || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{editing ? t("td.edit") : t("td.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">{t("td.title")}</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={t("td.titlePh")}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>{t("td.priority")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set({ priority: p.id })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    form.priority === p.id ? p.chip : "border-border/60 text-muted-foreground hover:bg-accent",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-due">{t("td.due")}</Label>
            <Input
              id="task-due"
              type="date"
              value={form.due_date}
              onChange={(e) => set({ due_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-note">{t("td.note")}</Label>
            <Textarea
              id="task-note"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
            />
          </div>
          <Button className="w-full" disabled={saveMutation.isPending} onClick={handleSave}>
            {saveMutation.isPending ? t("act.saving") : t("act.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}