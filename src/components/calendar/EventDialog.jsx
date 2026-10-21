import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, Trash2, UserPlus } from "lucide-react";
import {
  CATEGORIES,
  PRIORITIES,
  REMINDER_OPTIONS,
  REPEATS,
  reminderLabel,
  repeatUnitLabel,
} from "@/lib/categories";
import { dateInputValue, formatTime, timeInputValue, toISO } from "@/lib/calendar-utils";
import { createEvent, deleteEvent, updateEvent } from "@/lib/event-fns";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InviteFriends } from "@/components/calendar/InviteFriends";
import { cn } from "@/lib/utils";

export function EventDialog({ open, onOpenChange, occurrence, defaultDate, calendars }) {
  const { prefs } = usePreferences();
  const t = useT();
  const queryClient = useQueryClient();
  const create = useServerFn(createEvent);
  const update = useServerFn(updateEvent);
  const remove = useServerFn(deleteEvent);

  const editing = !!occurrence;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(prefs, defaultDate));

  useEffect(() => {
    if (!open) return;
    setForm(occurrence ? fromOccurrence(occurrence) : emptyForm(prefs, defaultDate));
  }, [open, occurrence, defaultDate, prefs]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["upcoming-reminders"] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? update({ data: { id: occurrence.id, ...payload } }) : create({ data: payload })),
    onSuccess: () => {
      invalidate();
      toast.success(editing ? t("ev.toastUpdated") : t("ev.toastCreated"));
      onOpenChange(false);
    },
    onError: () => toast.error(t("ev.toastErr")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id: occurrence.id } }),
    onSuccess: () => {
      invalidate();
      toast.success(t("ev.toastDeleted"));
      setConfirmOpen(false);
      onOpenChange(false);
    },
  });

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleReminder = (minutes) => {
    setForm((prev) => ({
      ...prev,
      reminderMinutes: prev.reminderMinutes.includes(minutes)
        ? prev.reminderMinutes.filter((m) => m !== minutes)
        : [...prev.reminderMinutes, minutes].sort((a, b) => a - b),
    }));
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    saveMutation.mutate({
      title: form.title.trim(),
      description: form.description,
      start_at: toISO(form.date, form.allDay ? "00:00" : form.startTime),
      end_at: toISO(form.date, form.allDay ? "23:59" : form.endTime),
      all_day: form.allDay,
      category: form.category,
      priority: form.priority,
      location: form.location,
      repeat: form.repeat,
      repeat_interval: form.repeatInterval,
      repeat_end_date: form.repeatEndDate || null,
      reminder_minutes: form.reminderMinutes.length ? form.reminderMinutes : [30],
      email_reminder: form.emailReminder,
      email_all_members: form.emailAll,
      calendar_id: form.calendarId || null,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editing ? t("ev.editTitle") : t("ev.newTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">{t("ev.titleLabel")}</Label>
              <Input
                id="ev-title"
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder={t("ev.titlePh")}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("ev.category")}</Label>
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
              <Label>{t("ev.priority")}</Label>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev-date">{t("ev.date")}</Label>
                <Input
                  id="ev-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set({ date: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-3 py-2.5">
                <Label htmlFor="ev-allday" className="cursor-pointer text-sm">
                  {t("ev.allDay")}
                </Label>
                <Switch id="ev-allday" checked={form.allDay} onCheckedChange={(v) => set({ allDay: v })} />
              </div>
            </div>

            {!form.allDay && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-start">{t("ev.start")}</Label>
                  <Input
                    id="ev-start"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set({ startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-end">{t("ev.end")}</Label>
                  <Input
                    id="ev-end"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set({ endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("ev.repeat")}</Label>
                <Select value={form.repeat} onValueChange={(v) => set({ repeat: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEATS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("ev.calendar")}</Label>
                <Select
                  value={form.calendarId || "personal"}
                  onValueChange={(v) => set({ calendarId: v === "personal" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">{t("ev.personalCal")}</SelectItem>
                    {calendars.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.repeat !== "none" && (
              <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-interval">{t("ev.repeatInterval")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="ev-interval"
                      type="number"
                      min={1}
                      max={365}
                      value={form.repeatInterval}
                      onChange={(e) => set({ repeatInterval: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">{repeatUnitLabel(form.repeat)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-enddate">{t("ev.repeatEnd")}</Label>
                  <Input
                    id="ev-enddate"
                    type="date"
                    value={form.repeatEndDate}
                    onChange={(e) => set({ repeatEndDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ev-location">{t("ev.location")}</Label>
              <Input
                id="ev-location"
                value={form.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder={t("ev.locationPh")}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-note">{t("ev.note")}</Label>
              <Textarea
                id="ev-note"
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={3}
                placeholder={t("ev.notePh")}
              />
            </div>

            {editing && occurrence?.id && (
              <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-3">
                <Label className="flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  {t("inv.label")}
                </Label>
                <InviteFriends eventId={occurrence.id} />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("ev.reminderLabel")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {REMINDER_OPTIONS.map((o) => {
                  const on = form.reminderMinutes.includes(o.minutes);
                  return (
                    <button
                      key={o.minutes}
                      type="button"
                      onClick={() => toggleReminder(o.minutes)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("rem.selected")}: {form.reminderMinutes.length ? form.reminderMinutes.map(reminderLabel).join(", ") : t("rem.default30")}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("ev.emailSend")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("ev.emailDesc")}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={form.emailReminder}
                  onCheckedChange={(v) => set({ emailReminder: v })}
                />
              </div>
              {form.emailReminder && form.calendarId && (
                <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                  <p className="text-sm">{t("ev.emailAll")}</p>
                  <Switch checked={form.emailAll} onCheckedChange={(v) => set({ emailAll: v })} />
                </div>
              )}
              {form.emailReminder && !prefs.email_reminders && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {t("ev.emailOff")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {editing ? (
              <Button variant="ghost" className="text-destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                {t("act.delete")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("act.cancel")}
              </Button>
              <Button disabled={!form.title.trim() || saveMutation.isPending} onClick={handleSave}>
                {saveMutation.isPending ? t("act.saving") : editing ? t("act.save") : t("act.add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ev.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("ev.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("act.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              {t("act.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function emptyForm(prefs, date) {
  const base = date ? new Date(date) : new Date();
  const start = new Date(base);
  if (!date) {
    start.setHours(start.getHours() + 1, 0, 0, 0);
  } else {
    start.setHours(9, 0, 0, 0);
  }
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    title: "",
    description: "",
    date: dateInputValue(base),
    allDay: false,
    startTime: timeInputValue(start),
    endTime: timeInputValue(end),
    category: prefs.default_category || "personal",
    priority: "medium",
    location: "",
    repeat: "none",
    repeatInterval: 1,
    repeatEndDate: "",
    reminderMinutes: [prefs.default_reminder_minutes ?? 30],
    emailReminder: false,
    emailAll: false,
    calendarId: "",
  };
}

function fromOccurrence(occ) {
  const start = new Date(occ.start_at);
  const end = occ.end_at ? new Date(occ.end_at) : new Date(start.getTime() + 3600000);
  return {
    title: occ.title || "",
    description: occ.description || "",
    date: dateInputValue(start),
    allDay: !!occ.all_day,
    startTime: formatTime(start),
    endTime: formatTime(end),
    category: occ.category || "personal",
    priority: occ.priority || "medium",
    location: occ.location || "",
    repeat: occ.repeat || "none",
    repeatInterval: occ.repeat_interval || 1,
    repeatEndDate: occ.repeat_end_date ? String(occ.repeat_end_date).slice(0, 10) : "",
    reminderMinutes:
      Array.isArray(occ.reminder_minutes) && occ.reminder_minutes.length ? occ.reminder_minutes : [30],
    emailReminder: !!occ.email_reminder,
    emailAll: (occ.email_recipients || []).length > 1,
    calendarId: occ.calendar_id || "",
  };
}