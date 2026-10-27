// Natural-language quick add, ported unchanged from the web's quick-add.js:
// "Toplantı yarın 15:00 acil @ Ofis" → event or task fields. Turkish and English.

import type { Priority } from '@/src/services/types';

function stripAccents(text: string) {
  return text
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C");
}

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MONTHS: Record<string, number> = {
  ocak: 0, subat: 1, sub: 1, mart: 2, nisan: 3, mayis: 4, may: 4, haziran: 5,
  temmuz: 6, agustos: 7, eylul: 8, ekim: 9, kasim: 10, ara: 11,
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8,
  october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
};

const DAYS: Record<string, number> = {
  pazar: 0, pzr: 0, sunday: 0, sun: 0,
  pazartesi: 1, pzt: 1, monday: 1, mon: 1,
  sali: 2, sal: 2, tuesday: 2, tue: 2, tues: 2,
  carsamba: 3, car: 3, wednesday: 3, wed: 3,
  persembe: 4, per: 4, thursday: 4, thu: 4, thur: 4, thurs: 4,
  cuma: 5, cum: 5, friday: 5, fri: 5,
  cumartesi: 6, cmt: 6, saturday: 6, sat: 6,
};

const TASK_HINTS = [
  "gorev", "görev", "yapilacak", "yapılacak", "hatirla", "hatırla",
  "bitir", "tamamla", "kontrol et", "task", "todo", "remind", "finish",
  "complete", "unutma", "don't forget",
];
const EVENT_HINTS = [
  "toplanti", "toplantı", "randevu", "bulusma", "buluşma", "ders", "konser",
  "rezervasyon", "kutlama", "parti", "sinema", "spor", "mulakat", "mülakat",
  "sunum", "sinav", "sınav", "seyahat", "ucak", "uçak", "meeting", "event",
  "class", "lesson", "concert", "celebration", "party", "movie", "film",
  "workout", "gym", "interview", "presentation", "exam", "travel", "flight",
];

// Words that only mark the type and are dropped from the title.
const TITLE_MARKERS = ["gorev", "yapilacak", "task", "todo", "hatirla", "remind", "unutma", "don't forget"];

function findDate(text: string, now: Date): { date: Date; span: RegExpMatchArray; start?: number } | null {
  const lower = stripAccents(text.toLowerCase());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let m = lower.match(/\b(bugun|today)\b/);
  if (m) return { date: today, span: m };

  m = lower.match(/\b(yarin|tomorrow)\b/);
  if (m) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { date: d, span: m };
  }

  m = lower.match(/\b(sonraki hafta|gelecek hafta|next week)\b/);
  if (m) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return { date: d, span: m };
  }

  m = lower.match(/\b(bu hafta sonu|this weekend)\b/);
  if (m) {
    const d = new Date(today);
    const diff = ((6 - d.getDay() + 7) % 7) || 7;
    d.setDate(d.getDate() + diff);
    return { date: d, span: m };
  }

  m = lower.match(/(\d+)\s*(gun|day)\s*(sonra|later|after)\b/);
  if (m) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(m[1], 10));
    return { date: d, span: m };
  }

  m = lower.match(/\b(in|icinde)\s+(\d+)\s*(gun|day|days)\b/);
  if (m) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(m[2], 10));
    return { date: d, span: m };
  }

  for (const [name, dayIdx] of Object.entries(DAYS)) {
    const plain = new RegExp(`\\b${esc(stripAccents(name))}\\b`, "i");
    const pm = lower.match(plain);
    if (pm) {
      const d = new Date(today);
      let diff = (dayIdx - d.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      d.setDate(d.getDate() + diff);
      return { date: d, span: pm };
    }
  }

  m = lower.match(/(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = parseInt(m[2], 10) - 1;
    let year = m[3] ? parseInt(m[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && mon >= 0 && mon <= 11) {
      const d = new Date(year, mon, day);
      if (d >= today || d.getMonth() === today.getMonth()) return { date: d, span: m };
    }
  }

  for (const [name, monIdx] of Object.entries(MONTHS)) {
    const re = new RegExp(`\\b${esc(name)}\\b`, "i");
    const pm = text.match(re);
    if (pm) {
      const idx = text.toLowerCase().indexOf(pm[0].toLowerCase());
      const before = text.slice(0, idx);
      const after = text.slice(idx + pm[0].length);
      let day: number | null = null;
      let dayStart = idx;
      const db = before.match(/(\d{1,2})(?:st|nd|rd|th)?\s*$/i);
      if (db) {
        day = parseInt(db[1], 10);
        dayStart = before.length - db[0].length;
      } else {
        const da = after.match(/^\s*(\d{1,2})(?:st|nd|rd|th)?/i);
        if (da) day = parseInt(da[1], 10);
      }
      if (day && day >= 1 && day <= 31) {
        const yearM = after.match(/^\s*\d{1,2}(?:st|nd|rd|th)?\s*(\d{4})/);
        const year = yearM ? parseInt(yearM[1], 10) : now.getFullYear();
        return { date: new Date(year, monIdx, day), span: pm, start: dayStart };
      }
    }
  }

  return null;
}

function findTime(text: string): { start: string; end: string | null; span: RegExpMatchArray } | null {
  const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\b/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" || ap === "p") {
    if (h < 12) h += 12;
  } else if (ap === "am" || ap === "a") {
    if (h === 12) h = 0;
  }
  if (h > 23 || mm > 59) return null;
  const start = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  // "2 saat" / "for 2h" / "until 17:00" gibi bitiş ipuçları
  const durM = text.match(/\b(\d+)\s*(saat|hours?|hrs?|h)\b/i);
  if (durM) {
    const endH = h + parseInt(durM[1], 10);
    return { start, end: `${String(endH % 24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, span: m };
  }
  const durMinM = text.match(/\b(\d+)\s*(dakika|minutes?|mins?|m)\b/i);
  if (durMinM) {
    const total = h * 60 + mm + parseInt(durMinM[1], 10);
    return { start, end: `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`, span: m };
  }
  return { start, end: null, span: m };
}

function findPriority(text: string): Priority | null {
  const lower = stripAccents(text.toLowerCase());
  if (/\b(acil|acele|urgent)\b/.test(lower)) return "urgent";
  if (/\b(onemli|oncelikli|important|critical|high)\b/.test(lower)) return "high";
  if (/\b(dusuk|dusuk|low|minor)\b/.test(lower)) return "low";
  if (/\b(normal)\b/.test(lower)) return "medium";
  return null;
}

function findLocation(text: string) {
  let m = text.match(/@\s*([^,@#]+?)(?=\s+(?:bugun|yarın|yarin|today|tomorrow|saat|at|:|\d)|$)/i);
  if (m) return m[1].trim();
  m = text.match(/\b(konum|yer|location|at)\s*[:\-]?\s*([^,@#]+)/i);
  if (m) return m[2].trim();
  return null;
}

const FILLER = [
  "bugun", "today", "yarin", "tomorrow", "sonraki", "gelecek", "next",
  "bu hafta sonu", "this weekend", "saat", "at", ":", "acil", "acele",
  "urgent", "onemli", "important", "dusuk", "low", "normal",
];

export type QuickAddResult = {
  type: 'event' | 'task';
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  priority: Priority | null;
  location: string;
  dueDate: string | null;
};

/** Parses the text: event or task, title, date, time, priority and location. */
export function parseQuickAdd(raw: string, now = new Date()): QuickAddResult | null {
  const text = (raw || "").trim();
  if (!text) return null;
  const lower = stripAccents(text.toLowerCase());

  let type: QuickAddResult['type'] = "event";
  if (TASK_HINTS.some((k) => lower.includes(stripAccents(k)))) type = "task";
  else if (EVENT_HINTS.some((k) => lower.includes(stripAccents(k)))) type = "event";

  const date = findDate(text, now);
  const time = findTime(text);
  const priority = findPriority(text);
  const location = findLocation(text);

  // Strip the recognised parts to get the title. Matching runs on an accent-free,
  // lower-cased mirror of the text (same length, char for char) and blanks the same
  // ranges in the original, so "yarın" or "toplantı" are found like "yarin".
  let orig = text;
  let mirror = stripAccents(text.toLocaleLowerCase("tr"));
  const norm = (s: string) => stripAccents(s.toLocaleLowerCase("tr"));
  const blank = (re: RegExp) => {
    mirror = mirror.replace(re, (match: string, ...args: unknown[]) => {
      const offset = args.find((a) => typeof a === "number") as number;
      orig = orig.slice(0, offset) + " ".repeat(match.length) + orig.slice(offset + match.length);
      return " ".repeat(match.length);
    });
  };

  for (const s of [date?.span?.[0], time?.span?.[0]]) {
    if (s) blank(new RegExp(esc(norm(s))));
  }
  if (location) blank(new RegExp(esc(norm(location))));
  blank(/@\s*/g);
  blank(/\b\d+\s*(saat|hours?|hrs?|h|dakika|minutes?|mins?|m)\b/gi);
  blank(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi);
  blank(/\b(\d{1,2})[/.](\d{1,2})([/.]\d{2,4})?\b/g);
  for (const f of FILLER) blank(new RegExp(`\\b${esc(f)}\\b`, "gi"));
  // Only pure markers go; words like "toplantı" or "bitir" are part of the title.
  for (const k of TITLE_MARKERS) blank(new RegExp(`\\b${esc(stripAccents(k))}\\b`, "gi"));
  const title = orig.replace(/\s+/g, " ").trim();

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = date
    ? `${date.date.getFullYear()}-${pad(date.date.getMonth() + 1)}-${pad(date.date.getDate())}`
    : null;

  return {
    type,
    title: title || text,
    date: dateStr,
    startTime: time?.start || null,
    endTime: time?.end || null,
    isAllDay: !time,
    priority,
    location: location || "",
    dueDate: dateStr,
  };
}