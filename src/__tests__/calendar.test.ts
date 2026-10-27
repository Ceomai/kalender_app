import { dueLabel } from '@/src/components/tasks/TaskItem';
import {
  addDays,
  dayKey,
  expandEvents,
  groupByDay,
  monthMatrix,
  rangeFor,
  rangeTitle,
  reminderTime,
  shiftCursor,
  startOfWeek,
  toISO,
} from '@/src/lib/calendar-utils';
import { buildICS } from '@/src/lib/ics-export';
import { planReminders } from '@/src/lib/notifications';
import { parseICS } from '@/src/lib/ics-parser';
import { parseQuickAdd } from '@/src/lib/quick-add';
import type { CalendarEvent } from '@/src/services/types';

jest.mock('@/src/lib/supabase', () => ({ getSupabase: jest.fn() }));
jest.mock('@/src/lib/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/src/lib/PreferencesContext', () => ({ usePreferences: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: {} }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

function ev(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'e1',
    title: 'Test',
    description: '',
    start_at: new Date(2026, 9, 5, 9).toISOString(),
    end_at: new Date(2026, 9, 5, 10).toISOString(),
    all_day: false,
    category: 'personal',
    priority: 'medium',
    location: '',
    repeat: 'none',
    repeat_interval: 1,
    repeat_end_date: null,
    reminder_minutes: [30],
    email_reminder: false,
    email_recipients: [],
    email_sent: false,
    done: false,
    calendar_id: null,
    calendar_name: '',
    calendar_color: '',
    owner_id: 'u',
    owner_name: '',
    visible_to: ['u'],
    external_uid: null,
    created_date: '',
    updated_date: '',
    created_by_id: 'u',
    ...partial,
  };
}

describe('weeks and ranges', () => {
  const wed = new Date(2026, 9, 28, 15);

  it('starts weeks on Monday or Sunday', () => {
    expect(dayKey(startOfWeek(wed, 'mon'))).toBe('2026-10-26');
    expect(dayKey(startOfWeek(wed, 'sun'))).toBe('2026-10-25');
  });

  it('builds a month matrix that covers the month', () => {
    const weeks = monthMatrix(wed, 'mon');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(dayKey(weeks[0][0])).toBe('2026-09-28');
    const days = weeks.flat().map(dayKey);
    expect(days).toContain('2026-10-01');
    expect(days).toContain('2026-10-31');
  });

  it('loads the right range per view', () => {
    expect(dayKey(rangeFor('week', wed, 'mon').to)).toBe('2026-11-01');
    expect(dayKey(rangeFor('agenda', wed).to)).toBe(dayKey(addDays(wed, 34)));
    expect(rangeFor('year', wed).from.getMonth()).toBe(0);
  });

  it('moves the cursor per view', () => {
    expect(dayKey(shiftCursor('day', wed, 1))).toBe('2026-10-29');
    expect(dayKey(shiftCursor('week', wed, -1))).toBe('2026-10-21');
    // Month steps keep to the 1st so 31 Jan + 1 month is February, not March.
    expect(shiftCursor('month', new Date(2026, 0, 31), 1).getMonth()).toBe(1);
    expect(shiftCursor('year', wed, 1).getFullYear()).toBe(2027);
  });

  it('titles the visible range', () => {
    expect(rangeTitle('month', wed)).toBe('Ekim 2026');
    expect(rangeTitle('week', wed, 'mon')).toBe('26 Ekim – 1 Kasım 2026');
  });
});

describe('expandEvents', () => {
  const from = new Date(2026, 9, 1);
  const to = new Date(2026, 9, 31, 23, 59);

  it('keeps single entries inside the range only', () => {
    const occ = expandEvents([ev({}), ev({ id: 'x', start_at: new Date(2026, 10, 2).toISOString() })], from, to);
    expect(occ.map((o) => o.id)).toEqual(['e1']);
    expect(occ[0].occurrence_end.getTime() - occ[0].occurrence_start.getTime()).toBe(3600000);
  });

  it('expands weekly series up to the end date', () => {
    const occ = expandEvents([ev({ repeat: 'weekly', repeat_end_date: '2026-10-19' })], from, to);
    expect(occ.map((o) => dayKey(o.occurrence_start))).toEqual(['2026-10-05', '2026-10-12', '2026-10-19']);
  });

  it('expands series that started before the range', () => {
    const occ = expandEvents([ev({ repeat: 'daily', repeat_interval: 10, start_at: new Date(2026, 8, 25, 8).toISOString() })], from, to);
    expect(occ.map((o) => dayKey(o.occurrence_start))).toEqual(['2026-10-05', '2026-10-15', '2026-10-25']);
  });

  it('keeps the day of month for monthly series, clamping short months', () => {
    const occ = expandEvents(
      [ev({ repeat: 'monthly', start_at: new Date(2026, 0, 31, 9).toISOString() })],
      new Date(2026, 1, 1),
      new Date(2026, 3, 30),
    );
    expect(occ.map((o) => dayKey(o.occurrence_start))).toEqual(['2026-02-28', '2026-03-28', '2026-04-28']);
  });

  it('groups occurrences by day', () => {
    const occ = expandEvents([ev({ repeat: 'biweekly' })], from, to);
    const byDay = groupByDay(occ);
    expect([...byDay.keys()]).toEqual(['2026-10-05', '2026-10-19']);
  });
});

describe('small helpers', () => {
  it('converts local date + time to ISO', () => {
    expect(new Date(toISO('2026-10-27', '15:30')).getHours()).toBe(15);
    expect(new Date(toISO('2026-10-27', '15:30')).getDate()).toBe(27);
  });

  it('fires at the earliest reminder (largest lead)', () => {
    const start = new Date(2026, 9, 5, 9);
    expect(reminderTime({ start_at: start.toISOString(), reminder_minutes: [60, 10] }).getTime()).toBe(start.getTime() - 3600000);
    expect(reminderTime({ start_at: start.toISOString(), reminder_minutes: [] }).getTime()).toBe(start.getTime() - 1800000);
  });

  it('labels due dates in local time', () => {
    const now = new Date(2026, 9, 27, 23, 30);
    expect(dueLabel('2026-10-27', now)).toEqual({ text: 'Bugün', overdue: false });
    expect(dueLabel('2026-10-28', now)).toEqual({ text: 'Yarın', overdue: false });
    expect(dueLabel('2026-10-24', now)?.overdue).toBe(true);
    expect(dueLabel(null, now)).toBeNull();
  });
});

describe('parseQuickAdd', () => {
  const now = new Date(2026, 9, 27, 10); // Tuesday

  it('reads a Turkish entry with time, priority and place', () => {
    const r = parseQuickAdd('Toplantı yarın 15:00 acil @ Ofis', now)!;
    expect(r).toMatchObject({ type: 'event', date: '2026-10-28', startTime: '15:00', priority: 'urgent', location: 'Ofis', isAllDay: false });
  });

  it('recognises tasks and all-day entries', () => {
    const r = parseQuickAdd('Faturayı öde görev cuma', now)!;
    expect(r.type).toBe('task');
    expect(r.dueDate).toBe('2026-10-30');
    expect(r.isAllDay).toBe(true);
  });

  it('reads durations and English', () => {
    const r = parseQuickAdd('Gym tomorrow 7pm 2 hours', now)!;
    expect(r).toMatchObject({ date: '2026-10-28', startTime: '19:00', endTime: '21:00' });
  });

  it('returns null for empty text', () => {
    expect(parseQuickAdd('   ', now)).toBeNull();
  });
});

describe('ICS round trip', () => {
  it('exports entries that the importer reads back', () => {
    const [occ] = expandEvents(
      [ev({ title: 'Doktor, kontrol; 2', description: 'satır1\nsatır2', location: 'Kadıköy' })],
      new Date(2026, 9, 1),
      new Date(2026, 9, 31),
    );
    const parsed = parseICS(buildICS([occ]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      title: 'Doktor, kontrol; 2',
      description: 'satır1\nsatır2',
      location: 'Kadıköy',
      start_at: occ.occurrence_start.toISOString(),
      all_day: false,
    });
  });
});

describe('parseQuickAdd titles', () => {
  const now = new Date(2026, 9, 27, 10);

  it('strips Turkish date words and markers but keeps meaningful words', () => {
    expect(parseQuickAdd('Doktor randevusu yarın 15:00 acil @ Kadıköy', now)!.title).toBe('Doktor randevusu');
    expect(parseQuickAdd('Toplantı yarın 15:00', now)!.title).toBe('Toplantı');
    expect(parseQuickAdd('görev Raporu bitir cuma', now)!.title).toBe('Raporu bitir');
    expect(parseQuickAdd('Gym tomorrow 7pm 2 hours', now)!.title).toBe('Gym');
    expect(parseQuickAdd('Annemi ara 12/11 saat 18:30', now)!.title).toBe('Annemi ara');
  });
});

describe('planReminders', () => {
  const now = new Date(2026, 9, 27, 12);
  const opts = { now, timeFormat: '24h' as const, allDayLabel: 'Tüm gün' };

  it('schedules each future reminder lead once, earliest first', () => {
    const occ = expandEvents(
      [
        ev({ id: 'a', title: 'Toplantı', start_at: new Date(2026, 9, 27, 14).toISOString(), reminder_minutes: [10, 60, 60, 180], location: 'Ofis' }),
        ev({ id: 'b', title: 'Bitti', start_at: new Date(2026, 9, 27, 15).toISOString(), done: true }),
      ],
      now,
      addDays(now, 1),
    );
    const plan = planReminders(occ, opts);
    // 180 min before 14:00 is 11:00, already past.
    expect(plan.map((p) => p.at.getHours() * 60 + p.at.getMinutes())).toEqual([13 * 60, 13 * 60 + 50]);
    expect(plan[0]).toMatchObject({ title: 'Toplantı', body: '14:00 · Ofis', eventId: 'a' });
    expect(new Set(plan.map((p) => p.id)).size).toBe(plan.length);
  });

  it('expands repeats and respects the budget', () => {
    const occ = expandEvents([ev({ repeat: 'daily', start_at: new Date(2026, 9, 28, 9).toISOString() })], now, addDays(now, 30));
    expect(planReminders(occ, { ...opts, budget: 5 })).toHaveLength(5);
  });
});
