// Web template-fns.js
import { db, unwrap } from '@/src/services/db';
import { createEvent } from '@/src/services/events';
import type { CalendarEvent, EventTemplate, Priority } from '@/src/services/types';

export type TemplateInput = {
  name: string;
  title: string;
  description?: string;
  location?: string;
  category?: string;
  priority?: Priority;
  duration_minutes?: number;
  all_day?: boolean;
  reminder_minutes?: number;
};

export async function listTemplates(): Promise<EventTemplate[]> {
  return unwrap(
    await db().from('event_templates').select('*').order('created_date', { ascending: false }).limit(100),
  );
}

export async function createTemplate(input: TemplateInput): Promise<EventTemplate> {
  return unwrap(
    await db()
      .from('event_templates')
      .insert({
        name: input.name.trim(),
        title: input.title.trim(),
        description: input.description ?? '',
        location: input.location ?? '',
        category: input.category || 'personal',
        priority: input.priority || 'medium',
        duration_minutes: input.duration_minutes || 60,
        all_day: !!input.all_day,
        reminder_minutes: input.reminder_minutes ?? 30,
      })
      .select()
      .single(),
  );
}

export async function deleteTemplate(id: string): Promise<{ ok: true }> {
  unwrap(await db().from('event_templates').delete().eq('id', id));
  return { ok: true };
}

/**
 * The next full hour after now, the default start for a template. (The web used
 * `ceil(h + 1)`, which skipped an hour: 15:20 → 17:00.)
 */
export function nextFullHour(now = Date.now()): Date {
  return new Date(Math.floor(now / 3600000 + 1) * 3600000);
}

/** Creates a personal entry from a template (default start: the next full hour). */
export async function applyTemplate(id: string, startAt?: string): Promise<CalendarEvent> {
  const tpl = unwrap(await db().from('event_templates').select('*').eq('id', id).maybeSingle()) as EventTemplate | null;
  if (!tpl) throw new Error('template_not_found');
  const start = startAt ? new Date(startAt) : nextFullHour();
  const end = new Date(start.getTime() + (tpl.duration_minutes || 60) * 60000);
  return createEvent({
    title: tpl.title,
    description: tpl.description,
    start_at: start.toISOString(),
    end_at: tpl.all_day ? null : end.toISOString(),
    all_day: tpl.all_day,
    category: tpl.category,
    priority: tpl.priority,
    location: tpl.location,
    repeat: 'none',
    reminder_minutes: [tpl.reminder_minutes ?? 30],
    calendar_id: null,
  });
}
