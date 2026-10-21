// Takvim görünümleri için tarih yardımcıları (yalnızca tarayıcıda kullanılır).
// Etiketler ve tarih adları dile duyarlıdır; currentLang üzerinden çevrilir.

import { getCurrentLang, tRaw } from "@/lib/i18n";

const pad = (n) => String(n).padStart(2, "0");

export function monthName(i, lang = getCurrentLang()) {
  return tRaw(`m.${i}`, lang);
}
export function weekdayShort(i, lang = getCurrentLang()) {
  return tRaw(`wd.${i}`, lang);
}
export function weekdayLong(i, lang = getCurrentLang()) {
  return tRaw(`wdf.${i}`, lang);
}

// Geriye dönük uyumluluk için sabitler (Türkçe).
export const MONTHS_TR = Array.from({ length: 12 }, (_, i) => tRaw(`m.${i}`, "tr"));
export const WEEKDAYS_MON = Array.from({ length: 7 }, (_, i) => tRaw(`wd.${(i + 1) % 7}`, "tr"));
export const WEEKDAYS_SUN = Array.from({ length: 7 }, (_, i) => tRaw(`wd.${i}`, "tr"));
export const WEEKDAYS_FULL = Array.from({ length: 7 }, (_, i) => tRaw(`wdf.${i}`, "tr"));

export const VIEWS = [
  { id: "month", get label() { return tRaw("view.month"); } },
  { id: "week", get label() { return tRaw("view.week"); } },
  { id: "day", get label() { return tRaw("view.day"); } },
  { id: "agenda", get label() { return tRaw("view.agenda"); } },
  { id: "year", get label() { return tRaw("view.year"); } },
];

export function weekdayLabels(weekStart) {
  return Array.from({ length: 7 }, (_, i) =>
    weekStart === "sun" ? weekdayShort(i) : weekdayShort((i + 1) % 7),
  );
}

export function dayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfWeek(date, weekStart = "mon") {
  const d = startOfDay(date);
  const first = weekStart === "sun" ? 0 : 1;
  const diff = (d.getDay() - first + 7) % 7;
  return addDays(d, -diff);
}

export function isSameDay(a, b) {
  return dayKey(a) === dayKey(b);
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function monthMatrix(cursor, weekStart) {
  const first = startOfWeek(startOfMonth(cursor), weekStart);
  const weeks = [];
  let day = first;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push(day);
      day = addDays(day, 1);
    }
    weeks.push(row);
  }
  const month = cursor.getMonth();
  const last = weeks[weeks.length - 1];
  if (last.every((d) => d.getMonth() !== month)) weeks.pop();
  return weeks;
}

// Görünüme göre yüklenecek tarih aralığı
export function rangeFor(view, cursor, weekStart = "mon") {
  if (view === "day") return { from: startOfDay(cursor), to: endOfDay(cursor) };
  if (view === "week") {
    const s = startOfWeek(cursor, weekStart);
    return { from: startOfDay(s), to: endOfDay(addDays(s, 6)) };
  }
  if (view === "agenda") {
    const s = startOfDay(cursor);
    return { from: s, to: endOfDay(addDays(s, 34)) };
  }
  if (view === "year") {
    return { from: new Date(cursor.getFullYear(), 0, 1), to: endOfDay(new Date(cursor.getFullYear(), 11, 31)) };
  }
  const s = startOfWeek(startOfMonth(cursor), weekStart);
  const e = addDays(startOfWeek(endOfMonth(cursor), weekStart), 6);
  return { from: startOfDay(s), to: endOfDay(e) };
}

export function shiftCursor(view, cursor, direction) {
  const d = new Date(cursor);
  if (view === "day") return addDays(d, direction);
  if (view === "week") return addDays(d, 7 * direction);
  if (view === "agenda") return addDays(d, 30 * direction);
  if (view === "year") {
    d.setFullYear(d.getFullYear() + direction);
    return d;
  }
  d.setDate(1);
  d.setMonth(d.getMonth() + direction);
  return d;
}

export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Kullanıcının saat biçimi tercihine göre okunabilir saat (24h veya 12h).
export function formatTimePref(date, timeFormat = "24h") {
  if (timeFormat === "12h") {
    const h24 = date.getHours();
    const m = date.getMinutes();
    const ap = h24 < 12 ? tRaw("time.am") : tRaw("time.pm");
    const h12 = h24 % 12 || 12;
    return `${h12}:${pad(m)} ${ap}`;
  }
  return formatTime(date);
}

export function formatDateShort(date) {
  return `${date.getDate()} ${monthName(date.getMonth()).slice(0, 3)}`;
}

export function formatDateTimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${monthName(d.getMonth()).slice(0, 3)} ${formatTime(d)}`;
}

export function formatDayLong(date) {
  return `${date.getDate()} ${monthName(date.getMonth())} ${date.getFullYear()}, ${weekdayLong(date.getDay())}`;
}

export function rangeTitle(view, cursor, weekStart = "mon") {
  if (view === "day") return formatDayLong(cursor);
  if (view === "week") {
    const s = startOfWeek(cursor, weekStart);
    const e = addDays(s, 6);
    const sameMonth = s.getMonth() === e.getMonth();
    const left = `${s.getDate()} ${monthName(s.getMonth())}`;
    const right = sameMonth ? `${e.getDate()}` : `${e.getDate()} ${monthName(e.getMonth())}`;
    return `${left} – ${right} ${e.getFullYear()}`;
  }
  if (view === "agenda") {
    const s = startOfDay(cursor);
    const e = addDays(s, 34);
    return `${s.getDate()} ${monthName(s.getMonth())} – ${e.getDate()} ${monthName(e.getMonth())}`;
  }
  if (view === "year") return `${cursor.getFullYear()}`;
  return `${monthName(cursor.getMonth())} ${cursor.getFullYear()}`;
}

// Tekrarlayan kayıtları verilen aralıkta tek tek oluşumlara açar.
const MAX_OCCURRENCES = 400;

function addMonthsKeepingDay(date, n) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function occurrence(ev, start, durationMs) {
  return {
    ...ev,
    occurrence_start: start,
    occurrence_end: new Date(start.getTime() + durationMs),
    occurrence_key: `${ev.id}-${start.toISOString()}`,
  };
}

export function expandEvents(events, from, to) {
  const out = [];
  const fromT = from.getTime();
  const toT = to.getTime();
  for (const ev of events || []) {
    const start = new Date(ev.start_at);
    if (Number.isNaN(start.getTime())) continue;
    const endRaw = ev.end_at ? new Date(ev.end_at) : null;
    const durationMs = endRaw && !Number.isNaN(endRaw.getTime()) ? Math.max(0, endRaw - start) : 0;
    const repeat = ev.repeat && ev.repeat !== "none" ? ev.repeat : null;

    if (!repeat) {
      if (start.getTime() >= fromT && start.getTime() <= toT) out.push(occurrence(ev, start, durationMs));
      continue;
    }

    const interval = ev.repeat_interval && ev.repeat_interval > 0 ? ev.repeat_interval : 1;
    const endDate = ev.repeat_end_date ? new Date(ev.repeat_end_date) : null;
    const endLimitT =
      endDate && !Number.isNaN(endDate.getTime()) ? Math.min(endDate.getTime() + 86400000, toT) : toT;

    let cur = new Date(start);
    const stepDays = repeat === "daily" ? 1 : repeat === "weekly" ? 7 : repeat === "biweekly" ? 14 : null;
    const stepMonths = repeat === "monthly" ? 1 : repeat === "yearly" ? 12 : null;

    if (stepDays) {
      const stepMs = stepDays * interval * 86400000;
      if (cur.getTime() < fromT) {
        const jumps = Math.floor((fromT - cur.getTime()) / stepMs);
        if (jumps > 0) cur = new Date(cur.getTime() + jumps * stepMs);
      }
    } else if (stepMonths) {
      const sm = stepMonths * interval;
      let guard = 0;
      while (cur.getTime() < fromT && guard < 2400) {
        cur = addMonthsKeepingDay(cur, sm);
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
  return out.sort((a, b) => a.occurrence_start - b.occurrence_start);
}

export function groupByDay(occurrences) {
  const map = new Map();
  for (const o of occurrences) {
    const key = dayKey(o.occurrence_start);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(o);
  }
  return map;
}

// Yaklaşan hatırlatıcı için okunabilir sayaç
export function countdown(target) {
  const diff = target.getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  const mk = (key, n) => tRaw(key).replace("{n}", n);
  if (mins <= 0) return tRaw("cd.now");
  if (mins < 60) return mk("cd.mins", mins);
  const hours = Math.round(mins / 60);
  if (hours < 24) return mk("cd.hours", hours);
  const days = Math.round(hours / 24);
  return mk("cd.days", days);
}

// Bir kaydın ilk hatırlatma zamanı (yoksa varsayılan 30 dk önce)
export function reminderTime(ev) {
  const leads = Array.isArray(ev.reminder_minutes) && ev.reminder_minutes.length ? ev.reminder_minutes : [30];
  const lead = Math.min(...leads.map((n) => Number(n) || 0));
  return new Date(new Date(ev.start_at).getTime() - lead * 60000);
}

// Yerel tarih-saat -> ISO (UTC) metin
export function toISO(dateOnly, timeValue) {
  const [y, m, d] = String(dateOnly).split("-").map(Number);
  const [hh, mm] = (timeValue || "09:00").split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString();
}

export function dateInputValue(date) {
  return dayKey(date);
}

export function timeInputValue(date) {
  return formatTime(date);
}