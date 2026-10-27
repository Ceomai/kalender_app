import { parseICS } from '@/src/lib/ics-parser';
import { periodRange, summarize } from '@/src/services/analytics';
import { likeEscape } from '@/src/services/db';
import { toFriend } from '@/src/services/friends';
import { nextFullHour } from '@/src/services/templates';
import type { Friendship } from '@/src/services/types';

// The services import the Supabase client; these tests only use their pure helpers.
jest.mock('@/src/lib/supabase', () => ({ getSupabase: jest.fn() }));
jest.mock('@/src/lib/AuthContext', () => ({ useAuth: jest.fn() }));

describe('analytics', () => {
  it('weeks start on Monday, months and years on the 1st', () => {
    const wed = new Date(2026, 9, 28, 15); // Wednesday 28 Oct 2026
    const week = periodRange('week', wed);
    expect(week.from).toEqual(new Date(2026, 9, 26));
    expect(week.to).toEqual(new Date(2026, 10, 2));
    const sun = periodRange('week', new Date(2026, 10, 1, 9)); // Sunday belongs to the previous week
    expect(sun.from).toEqual(new Date(2026, 9, 26));
    expect(periodRange('month', wed)).toEqual({ from: new Date(2026, 9, 1), to: new Date(2026, 10, 1) });
    expect(periodRange('year', wed)).toEqual({ from: new Date(2026, 0, 1), to: new Date(2027, 0, 1) });
  });

  it('sums minutes per category and weekday', () => {
    const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();
    const result = summarize('week', [
      { start_at: at(26, 9), end_at: at(26, 10, 30), all_day: false, category: 'work' },
      { start_at: at(26, 14), end_at: at(26, 15), all_day: false, category: 'work' },
      { start_at: at(27, 18), end_at: at(27, 19), all_day: false, category: 'sport' },
      { start_at: at(28, 0), end_at: null, all_day: true, category: 'birthday' },
    ]);
    expect(result.totalMinutes).toBe(210);
    expect(result.totalEvents).toBe(4);
    expect(result.categories[0]).toEqual({ category: 'work', minutes: 150, count: 2, percentage: 71 });
    expect(result.categories.find((c) => c.category === 'birthday')).toMatchObject({ minutes: 0, count: 1 });
    expect(result.busiestDay).toBe(1); // Monday
    expect(result.busiestMinutes).toBe(150);
  });

  it('handles an empty period', () => {
    const result = summarize('month', []);
    expect(result).toMatchObject({ totalMinutes: 0, totalEvents: 0, categories: [] });
  });
});

describe('parseICS', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:abc@example.com',
    'SUMMARY:Doktor\\, kontrol',
    'DESCRIPTION:Satır 1\\nSatır 2 uzun açıklama',
    '  devamı',
    'LOCATION:Kadıköy',
    'DTSTART:20261102T090000Z',
    'DTEND:20261102T093000Z',
    'RRULE:FREQ=WEEKLY;COUNT=4',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART;VALUE=DATE:20261225',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'SUMMARY:No start',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  it('reads events, unfolds lines and unescapes text', () => {
    const [a, b, ...rest] = parseICS(ics);
    expect(rest).toHaveLength(0); // the entry without DTSTART is dropped
    expect(a).toEqual({
      title: 'Doktor, kontrol',
      description: 'Satır 1\nSatır 2 uzun açıklama devamı',
      location: 'Kadıköy',
      start_at: '2026-11-02T09:00:00.000Z',
      end_at: '2026-11-02T09:30:00.000Z',
      all_day: false,
      repeat: 'weekly',
      external_uid: 'abc@example.com',
    });
    expect(b).toMatchObject({ title: 'İçe aktarıldı', all_day: true, start_at: '2026-12-25T00:00:00.000Z', repeat: 'none' });
  });
});

describe('helpers', () => {
  it('maps a friendship to the other person', () => {
    const f = {
      id: 'f1',
      requester_id: 'me',
      requester_name: 'Ben',
      addressee_id: 'you',
      addressee_name: '',
      created_date: '2026-10-27T00:00:00Z',
    } as Friendship;
    expect(toFriend(f, 'me')).toEqual({ id: 'f1', friend_id: 'you', name: 'Arkadaş', created_date: f.created_date });
    expect(toFriend(f, 'you')).toMatchObject({ friend_id: 'me', name: 'Ben' });
  });

  it('escapes ilike wildcards', () => {
    expect(likeEscape('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('starts templates at the next full hour', () => {
    const now = new Date('2026-10-27T10:20:00Z').getTime();
    expect(nextFullHour(now).toISOString()).toBe('2026-10-27T11:00:00.000Z');
    expect(nextFullHour(new Date('2026-10-27T10:00:00Z').getTime()).toISOString()).toBe('2026-10-27T11:00:00.000Z');
  });
});
