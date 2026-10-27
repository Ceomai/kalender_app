// Date helpers for the calendar views, ported from the web's calendar-utils.js.
// Labels and date names follow the current language.

import { getCurrentLang, tRaw } from '@/src/i18n';
import type { CalendarEvent } from '@/src/services/types';
import type { CalendarView, TimeFormat, WeekStart } from '@/src/theme/types';

const pad = (n: number) => String(n).padStart(2, '0');

export function monthName(i: number, lang = getCurrentLang()) {
  return tRaw(`m.${i}`, lang);
}
export function weekdayShort(i: number, lang = getCurrentLang()) {
  return tRaw(`wd.${i}`, lang);
}
export function weekdayLong(i: number, lang = getCurrentLang()) {
  return tRaw(`wdf.${i}`, lang);
}

export const VIEWS: { id: CalendarView; readonly label: string }[] = [
  { id: 'month', get label() { return tRaw('view.month'); } },
  { id: 'week', get label() { return tRaw('view.week'); } },
  { id: 'day', get label() { return tRaw('view.day'); } },
  { id: 'agenda', get label() { return tRaw('view.agenda'); } },
  { id: 'year', get label() { return tRaw('view.year'); } },
];

export function weekdayLabels(weekStart: WeekStart) {
  return Array.from({ length: 7 }, (_, i) => (weekStart === 'sun' ? weekdayShort(i) : weekdayShort((i + 1) % 7)));
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfWeek(date: Date, weekStart: WeekStart = 'mon') {
  const d = startOfDay(date);
  const first = weekStart === 'sun' ? 0 : 1;
  return addDays(d, -((d.getDay() - first + 7) % 7));
}

export function isSameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b);
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

/** 5–6 rows of 7 days covering the cursor's month. */
export function monthMatrix(cursor: Date, weekStart: WeekStart) {
  let day = startOfWeek(startOfMonth(cursor), weekStart);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) {
      row.push(day);
      day = addDays(day, 1);
    }
    weeks.push(row);
  }
  if (weeks[5].every((d) => d.getMonth() !== cursor.getMonth())) weeks.pop();
  return weeks;
}

/** The date range a view loads. */
export function rangeFor(view: CalendarView, cursor: Date, weekStart: WeekStart = 'mon') {
  if (view === 'day') return { from: startOfDay(cursor), to: endOfDay(cursor) };
  if (view === 'week') {
    const s = startOfWeek(cursor, weekStart);
    return { from: startOfDay(s), to: endOfDay(addDays(s, 6)) };
  }
  if (view === 'agenda') {
    const s = startOfDay(cursor);
    return { from: s, to: endOfDay(addDays(s, 34)) };
  }
  if (view === 'year') {
    return { from: new Date(cursor.getFullYear(), 0, 1), to: endOfDay(new Date(cursor.getFullYear(), 11, 31)) };
  }
  const s = startOfWeek(startOfMonth(cursor), weekStart);
  const e = addDays(startOfWeek(endOfMonth(cursor), weekStart), 6);
  return { from: startOfDay(s), to: endOfDay(e) };
}

export function shiftCursor(view: CalendarView, cursor: Date, direction: number) {
  const d = new Date(cursor);
  if (view === 'day') return addDays(d, direction);
  if (view === 'week') return addDays(d, 7 * direction);
  if (view === 'agenda') return addDays(d, 30 * direction);
  if (view === 'year') {
    d.setFullYear(d.getFullYear() + direction);
    return d;
  }
  d.setDate(1);
  d.setMonth(d.getMonth() + direction);
  return d;
}

export function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Time in the user's 24h / 12h preference. */
export function formatTimePref(date: Date, timeFormat: TimeFormat = '24h') {
  if (timeFormat === '12h') {
    const h24 = date.getHours();
    const ap = h24 < 12 ? tRaw('time.am') : tRaw('time.pm');
    return `${h24 % 12 || 12}:${pad(date.getMinutes())} ${ap}`;
  }
  return formatTime(date);
}

export function formatDateShort(date: Date) {
  return `${date.getDate()} ${monthName(date.getMonth()).slice(0, 3)}`;
}

export function formatDateTimeLocal(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${monthName(d.getMonth()).slice(0, 3)} ${formatTime(d)}`;
}

export function formatDayLong(date: Date) {
  return `${date.getDate()} ${monthName(date.getMonth())} ${date.getFullYear()}, ${weekdayLong(date.getDay())}`;
}

export function rangeTitle(view: CalendarView, cursor: Date, weekStart: WeekStart = 'mon') {
  if (view === 'day') return formatDayLong(cursor);
  if (view === 'week') {
    const s = startOfWeek(cursor, weekStart);
    const e = addDays(s, 6);
    const left = `${s.getDate()} ${monthName(s.getMonth())}`;
    const right = s.getMonth() === e.getMonth() ? `${e.getDate()}` : `${e.getDate()} ${monthName(e.getMonth())}`;
    return `${left} – ${right} ${e.getFullYear()}`;
  }
  if (view === 'agenda') {
    const s = startOfDay(cursor);
    const e = addDays(s, 34);
    return `${s.getDate()} ${monthName(s.getMonth())} – ${e.getDate()} ${monthName(e.getMonth())}`;
  }
  if (view === 'year') return `${cursor.getFullYear()}`;
  return `${monthName(cursor.getMonth())} ${cursor.getFullYear()}`;
}

// --- Recurring entries --------------------------------------------------------

export type Occurrence = CalendarEvent & {
  occurrence_start: Date;
  occurrence_end: Date;
  occurrence_key: string;
};

const MAX_OCCURRENCES = 400;

function addMonthsKeepingDay(date: Date, n: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}

function occurrence(ev: CalendarEvent, start: Date, durationMs: number): Occurrence {
  return {
    ...ev,
    occurrence_start: start,
    occurrence_end: new Date(start.getTime() + durationMs),
    occurrence_key: `${ev.id}-${start.toISOString()}`,
  };
}

/** Expands entries (including repeating ones) into single occurrences inside [from, to]. */
export function expandEvents(events: CalendarEvent[] | undefined, from: Date, to: Date): Occurrence[] {
  const out: Occurrence[] = [];
  const fromT = from.getTime();
  const toT = to.getTime();
  for (const ev of events ?? []) {
    const start = new Date(ev.start_at);
    if (Number.isNaN(start.getTime())) continue;
    const endRaw = ev.end_at ? new Date(ev.end_at) : null;
    const durationMs = endRaw && !Number.isNaN(endRaw.getTime()) ? Math.max(0, endRaw.getTime() - start.getTime()) : 0;
    const repeat = ev.repeat && ev.repeat !== 'none' ? ev.repeat : null;

    if (!repeat) {
      if (start.getTime() >= fromT && start.getTime() <= toT) out.push(occurrence(ev, start, durationMs));
      continue;
    }

    const interval = ev.repeat_interval > 0 ? ev.repeat_interval : 1;
    const endDate = ev.repeat_end_date ? new Date(ev.repeat_end_date) : null;
    const endLimitT = endDate && !Number.isNaN(endDate.getTime()) ? Math.min(endDate.getTime() + 86400000, toT) : toT;

    let cur = new Date(start);
    const stepDays = repeat === 'daily' ? 1 : repeat === 'weekly' ? 7 : repeat === 'biweekly' ? 14 : null;
    const stepMonths = repeat === 'monthly' ? 1 : repeat === 'yearly' ? 12 : null;

    if (stepDays) {
      const stepMs = stepDays * interval * 86400000;
      if (cur.getTime() < fromT) {
        const jumps = Math.floor((fromT - cur.getTime()) / stepMs);
        if (jumps > 0) cur = new Date(cur.getTime() + jumps * stepMs);
      }
    } else if (stepMonths) {
      let guard = 0;
      while (cur.getTime() < fromT && guard < 2400) {
        cur = addMonthsKeepingDay(cur, stepMonths * interval);
        guard++;
      }
    }

    let count = 0;
    while (cur.getTime() <= endLimitT && count < MAX_OCCURRENCES) {
      if (cur.getTime() >= fromT) out.push(occurrence(ev, new Date(cur), durationMs));
      if (stepDays) cur = addDays(cur, stepDays * interval);
      else if (stepMonths) cur = addMonthsKeepingDay(cur, stepMonths * interval);
      count++;
    }
  }
  return out.sort((a, b) => a.occurrence_start.getTime() - b.occurrence_start.getTime());
}

export function groupByDay(occurrences: Occurrence[]) {
  const map = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const key = dayKey(o.occurrence_start);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }
  return map;
}

/** Readable countdown for the reminder bell ("in 5 min"). */
export function countdown(target: Date) {
  const mins = Math.round((target.getTime() - Date.now()) / 60000);
  const mk = (key: string, n: number) => tRaw(key).replace('{n}', String(n));
  if (mins <= 0) return tRaw('cd.now');
  if (mins < 60) return mk('cd.mins', mins);
  const hours = Math.round(mins / 60);
  if (hours < 24) return mk('cd.hours', hours);
  return mk('cd.days', Math.round(hours / 24));
}

/**
 * When the first reminder of an entry fires (30 minutes before when none is set).
 * The web took the smallest lead, so "1 hour + 10 min before" fired only 10 minutes ahead.
 */
export function reminderTime(ev: Pick<CalendarEvent, 'start_at' | 'reminder_minutes'>) {
  const leads = ev.reminder_minutes?.length ? ev.reminder_minutes : [30];
  const lead = Math.max(...leads.map((n) => Number(n) || 0));
  return new Date(new Date(ev.start_at).getTime() - lead * 60000);
}

/** Local "YYYY-MM-DD" + "HH:MM" → ISO (UTC) string. */
export function toISO(dateOnly: string, timeValue?: string) {
  const [y, m, d] = String(dateOnly).split('-').map(Number);
  const [hh, mm] = (timeValue || '09:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString();
}

export const dateInputValue = dayKey;
export const timeInputValue = formatTime;

/** "YYYY-MM-DD" → local Date at midnight. */
export function parseDateInput(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
