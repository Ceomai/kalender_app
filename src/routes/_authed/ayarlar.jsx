import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Moon, Sun } from "lucide-react";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { wipeAccount } from "@/lib/profile-fns";
import { SectionCard } from "@/components/common/SectionCard";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { PreferencePanel } from "@/components/settings/PreferencePanel";
import { ICSImport } from "@/components/settings/ICSImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/_authed/ayarlar")({
  head: () => ({ meta: [{ title: "Ayarlar · Takvimim" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const { prefs, update } = usePreferences();
  const t = useT();
  const [name, setName] = useState(prefs.display_name || "");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const wipe = useServerFn(wipeAccount);
  const deleteMutation = useMutation({
    mutationFn: () => wipe(),
    onSuccess: async () => {
      setConfirmDelete(false);
      await logout();
      navigate({ to: "/login", replace: true });
    },
  });

  useEffect(() => {
    setName(prefs.display_name || "");
  }, [prefs.display_name]);

  const saveName = async () => {
    if (!name.trim()) return;
    await update({ display_name: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("set.eyebrow")}
        </p>
        <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{t("set.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("set.intro")}
        </p>
      </div>

      <SectionCard title={t("set.profile")} description={t("set.profileDesc")}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="display-name">{t("set.displayName")}</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("set.displayNamePh")}
              autoComplete="off"
            />
          </div>
          <Button onClick={saveName} disabled={!name.trim()}>
            {saved ? t("act.saved") : t("act.save")}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("set.accountEmail")}: {user?.email}</p>
      </SectionCard>

      <SectionCard title={t("set.design")} description={t("set.designDesc")}>
        <div className="space-y-4">
          <ThemePicker />
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2">
              {prefs.dark_mode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <p className="text-sm font-medium">{t("set.darkMode")}</p>
                <p className="text-xs text-muted-foreground">{t("set.darkModeDesc")}</p>
              </div>
            </div>
            <Switch
              checked={!!prefs.dark_mode}
              onCheckedChange={(v) => update({ dark_mode: v })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t("set.viewReminder")}
        description={t("set.viewReminderDesc")}
      >
        <PreferencePanel />
      </SectionCard>

      <SectionCard title={t("ics.title")} description={t("ics.desc")}>
        <ICSImport />
      </SectionCard>

      <SectionCard title={t("set.deleteAccount")} description={t("set.deleteAccountDesc")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="text-sm font-medium">{t("set.deleteMe")}</p>
              <p className="text-xs text-muted-foreground">
                {t("set.deleteMeDesc")}
              </p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="shrink-0">
            {t("set.deleteBtn")}
          </Button>
        </div>
      </SectionCard>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("set.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("set.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("act.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t("act.deleting") : t("act.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}