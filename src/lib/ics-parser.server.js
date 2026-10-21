// ICS (iCalendar) parser — sunucu tarafında çalışır. Yüklenen .ics dosyasını
// okuyup VEVENT'leri basit Event kayıtlarına dönüştürür.

// Satır katlamasını açar: ICS'te boşluk/sekme ile başlayan satırlar önceki satırın devamıdır.
function unfold(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function unescapeICS(value) {
  return String(value || "")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// ICS tarihini ISO string'e çevirir.
// 20260101T100000Z → ISO
// 20260101T100000 → yerel (Z eksiği kabul et, UTC olarak yorumla)
// 20260101 (VALUE=DATE) → tüm gün, gün başlangıcı
function parseICSDate(raw, allDay) {
  if (!raw) return null;
  const v = raw.trim();
  // YYYYMMDD
  if (/^\d{8}$/.test(v) || allDay) {
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const d = v.slice(6, 8);
    return `${y}-${m}-${d}T00:00:00.000Z`;
  }
  // YYYYMMDDTHHMMSSZ
  if (/^\d{8}T\d{6}Z$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(9, 11)}:${v.slice(11, 13)}:${v.slice(13, 15)}.000Z`;
  }
  // YYYYMMDDTHHMMSS (tz eksiği → UTC kabul et)
  if (/^\d{8}T\d{6}$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(9, 11)}:${v.slice(11, 13)}:${v.slice(13, 15)}.000Z`;
  }
  return null;
}

// Özellik satırını parçalar: "DTSTART;VALUE=DATE:20260101" → { name, params, value }
function parseLine(line) {
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = left.split(";");
  const params = {};
  for (const p of paramParts) {
    const eq = p.indexOf("=");
    if (eq !== -1) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

// RRULE'dan tekrar türünü çıkar (basit): FREQ=DAILY/WEEKLY/MONTHLY/YEARLY
function freqToRepeat(rrule) {
  if (!rrule) return "none";
  const m = /FREQ=([A-Z]+)/i.exec(rrule);
  if (!m) return "none";
  const f = m[1].toUpperCase();
  if (f === "DAILY") return "daily";
  if (f === "WEEKLY") return "weekly";
  if (f === "MONTHLY") return "monthly";
  if (f === "YEARLY") return "yearly";
  return "none";
}

// ICS metnini alır, etkinlik nesneleri dizisi döndürür.
export function parseICS(text) {
  const lines = unfold(text);
  const events = [];
  let cur = null;

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const { name, params, value } = parsed;

    if (name === "BEGIN" && value === "VEVENT") {
      cur = { _summary: "", _desc: "", _loc: "", _start: null, _end: null, _allDay: false, _rrule: "", _uid: "" };
      continue;
    }
    if (name === "END" && value === "VEVENT" && cur) {
      const startISO = cur._start;
      if (startISO) {
        events.push({
          title: cur._summary || "İçe aktarıldı",
          description: cur._desc || "",
          location: cur._loc || "",
          start_at: startISO,
          end_at: cur._end || null,
          all_day: cur._allDay,
          repeat: freqToRepeat(cur._rrule),
          external_uid: cur._uid || "",
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    switch (name) {
      case "SUMMARY":
        cur._summary = unescapeICS(value);
        break;
      case "DESCRIPTION":
        cur._desc = unescapeICS(value);
        break;
      case "LOCATION":
        cur._loc = unescapeICS(value);
        break;
      case "UID":
        cur._uid = value;
        break;
      case "DTSTART":
        cur._allDay = params.VALUE === "DATE";
        cur._start = parseICSDate(value, cur._allDay);
        break;
      case "DTEND":
        cur._end = parseICSDate(value, params.VALUE === "DATE");
        break;
      case "RRULE":
        cur._rrule = value;
        break;
      default:
        break;
    }
  }
  return events;
}