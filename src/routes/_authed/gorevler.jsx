import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, CheckSquare } from "lucide-react";
import { listTasks, updateTask, deleteTask } from "@/lib/task-fns";
import { useT } from "@/lib/i18n";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_authed/gorevler")({
  head: () => ({ meta: [{ title: "Görevler · Takvimim" }] }),
  component: TasksPage,
});

const FILTERS = [
  { id: "all" },
  { id: "active" },
  { id: "completed" },
];

const PRIORITY_SORT = { urgent: 0, high: 1, medium: 2, low: 3 };

function TasksPage() {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fetchTasks = useServerFn(listTasks);
  const toggleFn = useServerFn(updateTask);
  const removeFn = useServerFn(deleteTask);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const tasks = tasksQuery.data || [];

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "active") list = list.filter((tk) => !tk.completed);
    if (filter === "completed") list = list.filter((tk) => tk.completed);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((tk) => tk.title.toLowerCase().includes(q) || (tk.description || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return PRIORITY_SORT[a.priority] - PRIORITY_SORT[b.priority];
    });
  }, [tasks, filter, search]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((tk) => !tk.completed).length,
      completed: tasks.filter((tk) => tk.completed).length,
    }),
    [tasks],
  );

  const toggleMutation = useMutation({
    mutationFn: (task) => toggleFn({ data: { id: task.id, completed: !task.completed } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeFn({ data: { id: toDelete.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setToDelete(null);
    },
  });

  return (
    <div className="animate-fade space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("task.eyebrow")}</p>
          <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{t("task.title")}</h1>
        </div>
        <Button onClick={() => setDialog({ task: null })}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("task.new")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("task.search")}
            className="pl-9"
          />
        </div>
        <div className="flex items-center rounded-full border border-border/70 bg-card/70 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                filter === f.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`task.filter.${f.id}`)} <span className="opacity-70">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {tasksQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card px-5 py-16 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted">
            <CheckSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("task.empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("task.emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleMutation.mutate(task)}
              onEdit={() => setDialog({ task })}
              onDelete={() => setToDelete(task)}
            />
          ))}
        </div>
      )}

      <TaskDialog
        open={!!dialog}
        onOpenChange={(open) => !open && setDialog(null)}
        task={dialog?.task || null}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("task.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("task.deleteDesc").replace("{name}", toDelete?.title || "")}</AlertDialogDescription>
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