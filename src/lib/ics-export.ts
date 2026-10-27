// .ics (iCalendar) export, ported from the web's ics-export.js. On the phone the file
// goes to the share sheet (Files, Mail, Calendar…); on the web it is downloaded.
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Occurrence } from '@/src/lib/calendar-utils';

const pad = (n: number) => String(n).padStart(2, '0');

function fmtUTC(date: Date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

function fmtDateOnly(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function escapeICS(value: string | null | undefined) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function fold(line: string) {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let s = line;
  while (s.length > 75) {
    parts.push(s.slice(0, 75));
    s = ' ' + s.slice(75);
  }
  parts.push(s);
  return parts.join('\r\n');
}

export function buildICS(occurrences: Occurrence[], calendarName = 'Takvimim') {
  const now = new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Takvimim//SyncEra//TR',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
  ];

  for (const o of occurrences) {
    const start = o.occurrence_start;
    const end = o.occurrence_end;
    lines.push('BEGIN:VEVENT');
    lines.push(fold(`UID:${o.occurrence_key || o.id}@takvimim`));
    lines.push(`DTSTAMP:${fmtUTC(now)}`);
    if (o.all_day) {
      lines.push(`DTSTART;VALUE=DATE:${fmtDateOnly(start)}`);
      if (end) lines.push(`DTEND;VALUE=DATE:${fmtDateOnly(end)}`);
    } else {
      lines.push(`DTSTART:${fmtUTC(start)}`);
      if (end) lines.push(`DTEND:${fmtUTC(end)}`);
    }
    lines.push(fold(`SUMMARY:${escapeICS(o.title)}`));
    if (o.description) lines.push(fold(`DESCRIPTION:${escapeICS(o.description)}`));
    if (o.location) lines.push(fold(`LOCATION:${escapeICS(o.location)}`));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Writes the occurrences to an .ics file and hands it to the share sheet (download on web). */
export async function shareICS(occurrences: Occurrence[], filename = 'takvimim.ics') {
  const content = buildICS(occurrences);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', UTI: 'public.calendar-event', dialogTitle: filename });
}

/** Lets the user pick an .ics file and returns its text (null when cancelled). */
export async function pickICSFile(): Promise<{ name: string; text: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/calendar', 'text/plain', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const text = asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return { name: asset.name, text };
}
