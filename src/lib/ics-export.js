// .ics (iCalendar) dışa aktarma — tarayıcıda dosya üretir ve indirir.

const pad = (n) => String(n).padStart(2, "0");

function fmtUTC(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

function fmtDateOnly(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function escapeICS(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function fold(line) {
  if (line.length <= 75) return line;
  const parts = [];
  let s = line;
  while (s.length > 75) {
    parts.push(s.slice(0, 75));
    s = " " + s.slice(75);
  }
  parts.push(s);
  return parts.join("\r\n");
}

// occurrences: takvim görünümündeki açılmış oluşumlar (occurrence_start/end içerir).
export function buildICS(occurrences, calendarName = "Takvimim") {
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Takvimim//SyncEra//TR",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
  ];

  for (const o of occurrences || []) {
    const start = o.occurrence_start || (o.start_at ? new Date(o.start_at) : null);
    if (!start) continue;
    const end = o.occurrence_end || (o.end_at ? new Date(o.end_at) : null);
    const allDay = !!o.all_day;
    const uid = `${o.occurrence_key || o.id}@takvimim`;
    lines.push("BEGIN:VEVENT");
    lines.push(fold(`UID:${uid}`));
    lines.push(`DTSTAMP:${fmtUTC(now)}`);
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${fmtDateOnly(start)}`);
      if (end) lines.push(`DTEND;VALUE=DATE:${fmtDateOnly(end)}`);
    } else {
      lines.push(`DTSTART:${fmtUTC(start)}`);
      if (end) lines.push(`DTEND:${fmtUTC(end)}`);
    }
    lines.push(fold(`SUMMARY:${escapeICS(o.title)}`));
    if (o.description) lines.push(fold(`DESCRIPTION:${escapeICS(o.description)}`));
    if (o.location) lines.push(fold(`LOCATION:${escapeICS(o.location)}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(occurrences, filename = "takvimim.ics") {
  const content = buildICS(occurrences);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}