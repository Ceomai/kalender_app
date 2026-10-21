import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CATEGORIES, PRIORITIES, REMINDER_OPTIONS } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import { createTemplate } from "@/lib/template-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 480];

const empty = {
  name: "",
  title: "",
  description: "",
  location: "",
  category: "personal",
  priority: "medium",
  duration: 60,
  allDay: false,
  reminder: 30,
};

// Yeni etkinlik şablonu oluşturma formu.
export function TemplateDialog({ open, onOpenChange }) {
  const t = useT();
  const queryClient = useQueryClient();
  const create = useServerFn(createTemplate);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          name: form.name.trim(),
          title: form.title.trim(),
          description: form.description,
          location: form.location,
          category: form.category,
          priority: form.priority,
          duration_minutes: form.allDay ? 60 : Number(form.duration),
          all_day: form.allDay,
          reminder_minutes: Number(form.reminder),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(t("tdlg.toastCreated"));
      onOpenChange(false);
    },
    onError: () => toast.error(t("tdlg.toastErr")),
  });

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const durLabel = (d) => (d < 60 ? t("tpl.dur.min").replace("{n}", d) : t("tpl.dur.hr").replace("{n}", d / 60));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{t("tdlg.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">{t("tdlg.name")}</Label>
            <Input id="tpl-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("tdlg.namePh")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-title">{t("tdlg.eventTitle")}</Label>
            <Input id="tpl-title" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder={t("tdlg.eventTitlePh")} />
          </div>
          <div className="space-y-2">
            <Label>{t("tdlg.category")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const on = form.category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set({ category: c.id })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      on ? c.chip : "border-border/60 text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("tdlg.priority")}</Label>
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
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-3 py-2.5">
            <Label htmlFor="tpl-allday" className="cursor-pointer text-sm">{t("tdlg.allDay")}</Label>
            <Switch id="tpl-allday" checked={form.allDay} onCheckedChange={(v) => set({ allDay: v })} />
          </div>
          {!form.allDay && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("tdlg.duration")}</Label>
                <Select value={String(form.duration)} onValueChange={(v) => set({ duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{durLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tdlg.reminder")}</Label>
                <Select value={String(form.reminder)} onValueChange={(v) => set({ reminder: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((o) => (
                      <SelectItem key={o.minutes} value={String(o.minutes)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="tpl-loc">{t("tdlg.location")}</Label>
            <Input id="tpl-loc" value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder={t("tdlg.locationPh")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc">{t("tdlg.note")}</Label>
            <Textarea id="tpl-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} />
          </div>
          <Button
            className="w-full"
            disabled={!form.name.trim() || !form.title.trim() || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t("act.saving") : t("tdlg.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}