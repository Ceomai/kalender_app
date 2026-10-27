// Web calendar-fns.js
import { db, rpc, unwrap } from '@/src/services/db';
import type { Calendar, CalendarColor, Result } from '@/src/services/types';

export const CALENDAR_COLORS: CalendarColor[] = ['violet', 'sky', 'emerald', 'amber', 'rose', 'slate'];

/** Shared calendars I belong to (newest first). */
export async function listCalendars(): Promise<Calendar[]> {
  return unwrap(await db().from('calendars').select('*').order('created_date', { ascending: false }).limit(100));
}

/** New shared calendar; owner, members and invite code are set by the database. */
export async function createCalendar(input: {
  name: string;
  description?: string;
  color?: CalendarColor;
}): Promise<Calendar> {
  return unwrap(
    await db()
      .from('calendars')
      .insert({
        name: input.name.trim(),
        description: (input.description ?? '').trim(),
        color: input.color ?? 'violet',
      })
      .select()
      .single(),
  );
}

export async function joinCalendarByCode(code: string): Promise<Result<{ calendar: Calendar }>> {
  return rpc('join_calendar_by_code', { p_code: code });
}

/** Leaves a calendar; an owner hands it over, or deletes it when they are the last member. */
export async function leaveCalendar(id: string): Promise<Result<{ removed: boolean }>> {
  return rpc('leave_calendar', { p_id: id });
}

/** Deletes a calendar and its entries (owner only). */
export async function deleteCalendar(id: string): Promise<Result> {
  const rows = unwrap(await db().from('calendars').delete().eq('id', id).select('id'));
  // RLS hides other people's calendars, so "nothing deleted" means missing or not the owner.
  return rows.length ? { ok: true } : { ok: false, reason: 'forbidden' };
}
