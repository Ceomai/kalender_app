// ICS (iCalendar) parser, ported from the web's ics-parser.server.js. Turns the
// VEVENTs of an .ics file into plain event fields.

import type { Repeat } from '@/src/services/types';

export type ParsedICSEvent = {
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  repeat: Repeat;
  external_uid: string;
};

// Unfolds continuation lines: lines starting with a space/tab continue the previous one.
function unfold(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function unescapeICS(value: string): string {
  return String(value || '')
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

// 20260101T100000Z → ISO; 20260101T100000 (no zone) → read as UTC;
// 20260101 (VALUE=DATE) → all-day, start of day.
function parseICSDate(raw: string, allDay: boolean): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (/^\d{8}$/.test(v) || allDay) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T00:00:00.000Z`;
  }
  if (/^\d{8}T\d{6}Z?$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(9, 11)}:${v.slice(11, 13)}:${v.slice(13, 15)}.000Z`;
  }
  return null;
}

// "DTSTART;VALUE=DATE:20260101" → { name, params, value }
function parseLine(line: string) {
  const colon = line.indexOf(':');
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = left.split(';');
  const params: Record<string, string> = {};
  for (const p of paramParts) {
    const eq = p.indexOf('=');
    if (eq !== -1) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

// Only the frequency of an RRULE is kept: FREQ=DAILY/WEEKLY/MONTHLY/YEARLY.
function freqToRepeat(rrule: string): Repeat {
  const m = /FREQ=([A-Z]+)/i.exec(rrule || '');
  switch (m?.[1].toUpperCase()) {
    case 'DAILY':
      return 'daily';
    case 'WEEKLY':
      return 'weekly';
    case 'MONTHLY':
      return 'monthly';
    case 'YEARLY':
      return 'yearly';
    default:
      return 'none';
  }
}

export function parseICS(text: string, fallbackTitle = 'İçe aktarıldı'): ParsedICSEvent[] {
  const events: ParsedICSEvent[] = [];
  let cur: {
    summary: string;
    desc: string;
    loc: string;
    start: string | null;
    end: string | null;
    allDay: boolean;
    rrule: string;
    uid: string;
  } | null = null;

  for (const line of unfold(text)) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const { name, params, value } = parsed;

    if (name === 'BEGIN' && value === 'VEVENT') {
      cur = { summary: '', desc: '', loc: '', start: null, end: null, allDay: false, rrule: '', uid: '' };
      continue;
    }
    if (name === 'END' && value === 'VEVENT' && cur) {
      if (cur.start) {
        events.push({
          title: cur.summary || fallbackTitle,
          description: cur.desc,
          location: cur.loc,
          start_at: cur.start,
          end_at: cur.end,
          all_day: cur.allDay,
          repeat: freqToRepeat(cur.rrule),
          external_uid: cur.uid,
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    switch (name) {
      case 'SUMMARY':
        cur.summary = unescapeICS(value);
        break;
      case 'DESCRIPTION':
        cur.desc = unescapeICS(value);
        break;
      case 'LOCATION':
        cur.loc = unescapeICS(value);
        break;
      case 'UID':
        cur.uid = value;
        break;
      case 'DTSTART':
        cur.allDay = params.VALUE === 'DATE';
        cur.start = parseICSDate(value, cur.allDay);
        break;
      case 'DTEND':
        cur.end = parseICSDate(value, params.VALUE === 'DATE');
        break;
      case 'RRULE':
        cur.rrule = value;
        break;
    }
  }
  return events;
}
