import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clock, Layers, MapPin, Plus } from "lucide-react";
import { listTemplates, deleteTemplate, applyTemplate } from "@/lib/template-fns";
import { categoryOf, priorityOf } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import { TemplateDialog } from "@/components/templates/TemplateDialog";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/sablonlar")({
  head: () => ({ meta: [{ title: "Şablonlar · Takvimim" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchList = useServerFn(listTemplates);
  const removeFn = useServerFn(deleteTemplate);
  const applyFn = useServerFn(applyTemplate);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const templatesQuery = useQuery({ queryKey: ["templates"], queryFn: () => fetchList() });
  const templates = templatesQuery.data || [];

  const applyMutation = useMutation({
    mutationFn: (tpl) => applyFn({ data: { id: tpl.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(t("tpl.toastCreated"));
      navigate({ to: "/" });
    },
    onError: () => toast.error(t("tpl.toastErr")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeFn({ data: { id: toDelete.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setToDelete(null);
    },
  });

  const durLabel = (m) => (m < 60 ? t("tpl.dur.min").replace("{n}", m) : t("tpl.dur.hr").replace("{n}", m / 60));

  return (
    <div className="animate-fade space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("tpl.eyebrow")}</p>
          <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{t("tpl.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("tpl.intro")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("tpl.new")}
        </Button>
      </div>

      {templatesQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card px-5 py-16 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("tpl.empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("tpl.emptyDesc")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((tpl) => {
            const cat = categoryOf(tpl.category);
            const prio = priorityOf(tpl.priority);
            const Icon = cat.icon;
            return (
              <div key={tpl.id} className="flex flex-col rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", cat.solid, "text-white")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{tpl.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{tpl.title}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", prio.chip)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", prio.dot)} />
                    {prio.label}
                  </span>
                  {!tpl.all_day && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {durLabel(tpl.duration_minutes)}
                    </span>
                  )}
                  {tpl.all_day && (
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">{t("tpl.allDay")}</span>
                  )}
                  {tpl.location && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {tpl.location}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={applyMutation.isPending}
                    onClick={() => applyMutation.mutate(tpl)}
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    {t("tpl.use")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setToDelete(tpl)}>
                    {t("act.delete")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tpl.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("tpl.deleteDesc").replace("{name}", toDelete?.name || "")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("act.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("act.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}