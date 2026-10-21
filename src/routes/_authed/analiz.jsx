import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, CalendarClock, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getAnalytics } from "@/lib/analysis-fns";
import { categoryOf } from "@/lib/categories";
import { weekdayShort } from "@/lib/calendar-utils";
import { tRaw, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/analiz")({
  head: () => ({ meta: [{ title: "Zaman Analizi · Takvimim" }] }),
  component: AnalysisPage,
});

const PERIODS = [
  { id: "week" },
  { id: "month" },
  { id: "year" },
];

const CAT_HEX = {
  personal: "#8b5cf6", work: "#0ea5e9", meeting: "#6366f1", birthday: "#ec4899",
  health: "#f43f5e", payment: "#f59e0b", education: "#14b8a6", travel: "#06b6d4",
  sport: "#84cc16", holiday: "#f97316", other: "#64748b",
};

function formatHours(minutes) {
  if (!minutes) return tRaw("an.hours0");
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return tRaw("an.min").replace("{n}", m);
  if (m === 0) return tRaw("an.hr").replace("{n}", h);
  return tRaw("an.hm").replace("{h}", h).replace("{m}", m);
}

function AnalysisPage() {
  const t = useT();
  const [period, setPeriod] = useState("week");
  const fetch = useServerFn(getAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", period], queryFn: () => fetch({ data: { period } }) });

  const totalMinutes = data?.totalMinutes || 0;
  const totalEvents = data?.totalEvents || 0;
  const categories = data?.categories || [];
  const days = data?.days || [];
  const busiestDay = data?.busiestDay ?? 0;

  const dayLabels = Array.from({ length: 7 }, (_, i) => weekdayShort(i));
  const dayData = days.map((d) => ({
    name: dayLabels[d.day],
    dakika: Math.round(d.minutes),
    adet: d.count,
  }));

  const pieData = categories.map((c) => ({
    name: categoryOf(c.category).label,
    value: Math.round(c.minutes),
    count: c.count,
    hex: CAT_HEX[c.category] || "#64748b",
  }));

  return (
    <div className="animate-fade space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("an.eyebrow")}</p>
        <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{t("an.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("an.intro")}</p>
      </div>

      <div className="flex items-center rounded-full border border-border/70 bg-card/70 p-1 sm:w-auto">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition",
              period === p.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`an.period.${p.id}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="mb-1 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <CalendarClock className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">{t("an.totalTime")}</p>
              <p className="font-heading text-lg font-semibold">{formatHours(totalMinutes)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="mb-1 grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <BarChart3 className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">{t("an.events")}</p>
              <p className="font-heading text-lg font-semibold">{totalEvents}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="mb-1 grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">{t("an.busiestDay")}</p>
              <p className="font-heading text-lg font-semibold">{dayLabels[busiestDay]}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="mb-3 text-sm font-semibold">{t("an.byCategory")}</p>
              {pieData.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground">{t("an.noData")}</p>
              ) : (
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="h-44 w-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                          {pieData.map((d) => (
                            <Cell key={d.name} fill={d.hex} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatHours(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.hex }} />
                          {d.name}
                        </span>
                        <span className="text-muted-foreground">{formatHours(d.value)} · {d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="mb-3 text-sm font-semibold">{t("an.byDay")}</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayData}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
                    <Tooltip formatter={(v) => formatHours(v)} />
                    <Bar dataKey="dakika" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}