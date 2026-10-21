import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Moon, Sun } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { usePreferences } from "@/lib/PreferencesContext";
import { useT } from "@/lib/i18n";
import { ReminderBell } from "@/components/layout/ReminderBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ user }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { prefs, update } = usePreferences();
  const t = useT();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="hidden font-heading text-lg font-semibold tracking-tight sm:block">
              {t("brand")}
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 rounded-full border border-border/70 bg-card/60 p-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("as.toggleTheme")}
              onClick={() => update({ dark_mode: !prefs.dark_mode })}
            >
              {prefs.dark_mode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <ReminderBell />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:pb-12">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}