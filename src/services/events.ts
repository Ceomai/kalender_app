// Web event-fns.js
import { db, likeEscape, requireUserId, unwrap } from '@/src/services/db';
import type { CalendarEvent, Priority, Repeat } from '@/src/services/types';

export type EventInput = {
  title: string;
  description?: string;
  start_at: string;
  end_at?: string | null;
  all_day?: boolean;
  category?: string;
  priority?: Priority;
  location?: string;
  repeat?: Repeat;
  repeat_interval?: number;
  repeat_end_date?: string | null;
  reminder_minutes?: number[];
  email_reminder?: boolean;
  /** Send the e-mail reminder to every member of the shared calendar, not just me. */
  email_all_members?: boolean;
  /** Shared calendar id; "" or null for a personal entry. */
  calendar_id?: string | null;
};

export type EventFilters = {
  from: string;
  to: string;
  categories?: string[];
  priority?: Priority;
  calendarId?: string;
  search?: string;
};

const RECURRING: Repeat[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

/** E-mail recipients as the web computed them; the database keeps only people who can see the entry. */
async function emailRecipients(me: string, input: Pick<EventInput, 'email_reminder' | 'email_all_members' | 'calendar_id'>) {
  if (!input.email_reminder) return [];
  if (input.email_all_members && input.calendar_id) {
    const cal = unwrap(
      await db().from('calendars').select('members').eq('id', input.calendar_id).maybeSingle(),
    ) as { members: string[] } | null;
    if (cal) return Array.from(new Set([me, ...cal.members]));
  }
  return [me];
}

/**
 * Entries in [from, to) plus every recurring series (expanded on the client),
 * optionally filtered by category, priority, calendar and title.
 */
export async function listEvents(filters: EventFilters): Promise<CalendarEvent[]> {
  let query = db()
    .from('events')
    .select('*')
    .or(`and(start_at.gte."${filters.from}",start_at.lt."${filters.to}"),repeat.in.(${RECURRING.join(',')})`);
  if (filters.categories?.length) query = query.in('category', filters.categories);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.calendarId) query = query.eq('calendar_id', filters.calendarId);
  if (filters.search?.trim()) query = query.ilike('title', `%${likeEscape(filters.search.trim())}%`);
  return unwrap(await query.order('start_at').limit(500));
}

/** Upcoming, not-done entries for the reminder bell (from 30 minutes ago). */
export async function listUpcoming(days = 7): Promise<CalendarEvent[]> {
  const from = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + days * 86400000).toISOString();
  return unwrap(
    await db()
      .from('events')
      .select('*')
      .gte('start_at', from)
      .lt('start_at', to)
      .eq('done', false)
      .order('start_at')
      .limit(60),
  );
}

export async function createEvent(input: EventInput): Promise<CalendarEvent> {
  const me = await requireUserId();
  const calendarId = input.calendar_id || null;
  return unwrap(
    await db()
      .from('events')
      .insert({
        title: input.title.trim(),
        description: input.description ?? '',
        start_at: input.start_at,
        end_at: input.end_at || null,
        all_day: !!input.all_day,
        category: input.category || 'personal',
        priority: input.priority || 'medium',
        location: input.location ?? '',
        repeat: input.repeat || 'none',
        repeat_interval: input.repeat_interval || 1,
        repeat_end_date: input.repeat_end_date || null,
        reminder_minutes: input.reminder_minutes?.length ? input.reminder_minutes : [30],
        email_reminder: !!input.email_reminder,
        email_recipients: await emailRecipients(me, { ...input, calendar_id: calendarId }),
        calendar_id: calendarId,
      })
      .select()
      .single(),
  );
}

export async function updateEvent(id: string, patch: Partial<EventInput> & { done?: boolean }): Promise<CalendarEvent> {
  const me = await requireUserId();
  const { email_all_members: emailAll, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest };
  if ('title' in rest && rest.title !== undefined) data.title = rest.title.trim();
  if ('calendar_id' in rest) data.calendar_id = rest.calendar_id || null;
  if ('end_at' in rest) data.end_at = rest.end_at || null;
  if ('repeat_end_date' in rest) data.repeat_end_date = rest.repeat_end_date || null;
  // The database derives calendar name/colour and viewers; recipients follow the web's rules.
  if ('calendar_id' in rest || 'email_reminder' in rest) {
    data.email_recipients = await emailRecipients(me, {
      email_reminder: rest.email_reminder,
      email_all_members: 'calendar_id' in rest ? emailAll : false,
      calendar_id: (data.calendar_id as string | null | undefined) ?? null,
    });
  }
  return unwrap(await db().from('events').update(data).eq('id', id).select().single());
}

/** Marks one entry done / not done. */
export async function setEventDone(id: string, done: boolean): Promise<CalendarEvent> {
  return unwrap(await db().from('events').update({ done }).eq('id', id).select().single());
}

/** Deletes an entry (the whole series when it repeats). */
export async function deleteEvent(id: string): Promise<{ ok: boolean }> {
  const rows = unwrap(await db().from('events').delete().eq('id', id).select('id'));
  return { ok: rows.length > 0 };
}
