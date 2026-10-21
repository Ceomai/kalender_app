import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

// Dönem başlangıç/bitişi (yerel saat).
function periodRange(period, now) {
  if (period === "week") {
    const d = new Date(now);
    const day = d.getDay();
    const first = 1; // Pazartesi
    const diff = (day - first + 7) % 7;
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    return { from, to };
  }
  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from, to };
  }
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear() + 1, 0, 1);
  return { from, to };
}

// Belirli bir dönem için zaman analizi (kategori ve gün kırılımı).
export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ period: z.enum(["week", "month", "year"]) }))
  .handler(async ({ data, context }) => {
    const { from, to } = periodRange(data.period, new Date());
    const page = await context.getBase44().entities.Event.filter(
      { start_at: { $gte: from.toISOString(), $lt: to.toISOString() } },
      { sort: "start_at", limit: 1000 },
    );
    const events = page.items;

    let totalMinutes = 0;
    let totalEvents = 0;
    const catMap = new Map();
    const days = Array.from({ length: 7 }, (_, i) => ({ day: i, minutes: 0, count: 0 }));

    for (const e of events) {
      const s = new Date(e.start_at).getTime();
      const en = e.end_at ? new Date(e.end_at).getTime() : s;
      const mins = e.all_day ? 0 : Math.max(0, (en - s) / 60000);
      totalMinutes += mins;
      totalEvents += 1;
      const cat = e.category || "personal";
      const c = catMap.get(cat) || { category: cat, minutes: 0, count: 0 };
      c.minutes += mins;
      c.count += 1;
      catMap.set(cat, c);
      const d = new Date(e.start_at).getDay();
      days[d].minutes += mins;
      days[d].count += 1;
    }

    const categories = [...catMap.values()]
      .map((c) => ({
        ...c,
        minutes: Math.round(c.minutes),
        percentage: totalMinutes > 0 ? Math.round((c.minutes / totalMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    const busiest = days.reduce((m, d) => (d.minutes > m.minutes ? d : m), days[0]);

    return {
      period: data.period,
      totalMinutes: Math.round(totalMinutes),
      totalEvents,
      categories,
      days,
      busiestDay: busiest.day,
      busiestMinutes: Math.round(busiest.minutes),
    };
  });