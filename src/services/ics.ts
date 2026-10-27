// Web ics-import-fns.js. The app reads the picked .ics file itself, so there is no
// upload step: the text is parsed here and the entries are inserted directly.
import { parseICS } from '@/src/lib/ics-parser';
import { db, requireUserId, unwrap } from '@/src/services/db';

const MAX_ICS_LENGTH = 2_000_000;
const MAX_EVENTS = 1000;

export async function importICS(
  text: string,
  calendarId?: string | null,
): Promise<{ ok: true; created: number; skipped: number }> {
  if (!text || text.length > MAX_ICS_LENGTH) throw new Error('ics_too_large');
  const me = await requireUserId();
  const parsed = parseICS(text).slice(0, MAX_EVENTS);
  if (!parsed.length) return { ok: true, created: 0, skipped: 0 };

  // Skip entries already imported (same UID).
  const uids = parsed.map((e) => e.external_uid).filter(Boolean);
  const existing = new Set<string>();
  for (let i = 0; i < uids.length; i += 200) {
    const rows: { external_uid: string }[] = unwrap(
      await db()
        .from('events')
        .select('external_uid')
        .eq('created_by_id', me)
        .in('external_uid', uids.slice(i, i + 200)),
    );
    rows.forEach((r) => existing.add(r.external_uid));
  }

  const toCreate = parsed
    .filter((e) => !e.external_uid || !existing.has(e.external_uid))
    .map((e) => ({
      // Clamp to the column limits instead of failing the whole file.
      title: (e.title.trim() || 'İçe aktarıldı').slice(0, 120),
      description: e.description.slice(0, 2000),
      location: e.location.slice(0, 160),
      start_at: e.start_at,
      end_at: e.end_at,
      all_day: e.all_day,
      category: 'other',
      priority: 'medium',
      repeat: e.repeat,
      reminder_minutes: [30],
      calendar_id: calendarId || null,
      external_uid: e.external_uid ? e.external_uid.slice(0, 300) : null,
    }));

  let created = 0;
  for (let i = 0; i < toCreate.length; i += 200) {
    const rows = unwrap(await db().from('events').insert(toCreate.slice(i, i + 200)).select('id'));
    created += rows.length;
  }
  return { ok: true, created, skipped: parsed.length - toCreate.length };
}
