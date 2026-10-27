// Web analysis-fns.js
import { db, unwrap } from '@/src/services/db';
import type { CalendarEvent } from '@/src/services/types';

export type Period = 'week' | 'month' | 'year';

export type Analytics = {
  period: Period;
  totalMinutes: number;
  totalEvents: number;
  categories: { category: string; minutes: number; count: number; percentage: number }[];
  /** Index 0 = Sunday, like Date#getDay. */
  days: { day: number; minutes: number; count: number }[];
  busiestDay: number;
  busiestMinutes: number;
};

/** Start/end of the period in local time (weeks start on Monday, as on the web). */
export function periodRange(period: Period, now: Date): { from: Date; to: Date } {
  if (period === 'week') {
    const diff = (now.getDay() - 1 + 7) % 7;
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    return { from, to };
  }
  if (period === 'month') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }
  return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
}

/** Time spent per category and weekday. All-day entries count as entries but not minutes. */
export function summarize(
  period: Period,
  events: Pick<CalendarEvent, 'start_at' | 'end_at' | 'all_day' | 'category'>[],
): Analytics {
  let totalMinutes = 0;
  const catMap = new Map<string, { category: string; minutes: number; count: number }>();
  const days = Array.from({ length: 7 }, (_, i) => ({ day: i, minutes: 0, count: 0 }));

  for (const e of events) {
    const s = new Date(e.start_at).getTime();
    const en = e.end_at ? new Date(e.end_at).getTime() : s;
    const mins = e.all_day ? 0 : Math.max(0, (en - s) / 60000);
    totalMinutes += mins;
    const cat = e.category || 'personal';
    const c = catMap.get(cat) ?? { category: cat, minutes: 0, count: 0 };
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
    period,
    totalMinutes: Math.round(totalMinutes),
    totalEvents: events.length,
    categories,
    days: days.map((d) => ({ ...d, minutes: Math.round(d.minutes) })),
    busiestDay: busiest.day,
    busiestMinutes: Math.round(busiest.minutes),
  };
}

export async function getAnalytics(period: Period, now = new Date()): Promise<Analytics> {
  const { from, to } = periodRange(period, now);
  const events = unwrap(
    await db()
      .from('events')
      .select('start_at, end_at, all_day, category')
      .gte('start_at', from.toISOString())
      .lt('start_at', to.toISOString())
      .order('start_at')
      .limit(1000),
  );
  return summarize(period, events);
}
