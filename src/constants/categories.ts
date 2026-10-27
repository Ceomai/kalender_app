// Categories, priorities, repeats, reminder options and calendar colours — the web's
// lib/categories.js with Tailwind classes turned into hex values.
import {
  Briefcase,
  Cake,
  CreditCard,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Plane,
  Sun,
  Tag,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import { tRaw } from '@/src/i18n';
import type { CalendarColor, Priority, Repeat } from '@/src/services/types';

/** `border-X-200 bg-X-50 text-X-700` + the `bg-X-500` dot. */
export type ChipColors = { bg: string; fg: string; border: string; dot: string };

export type Category = { id: string; icon: LucideIcon; chip: ChipColors; readonly label: string };

const cat = (id: string, icon: LucideIcon, chip: ChipColors): Category => ({
  id,
  icon,
  chip,
  get label() {
    return tRaw(`cat.${id}`);
  },
});

export const CATEGORIES: Category[] = [
  cat('personal', User, { bg: '#f5f3ff', fg: '#6d28d9', border: '#ddd6fe', dot: '#8b5cf6' }),
  cat('work', Briefcase, { bg: '#f0f9ff', fg: '#0369a1', border: '#bae6fd', dot: '#0ea5e9' }),
  cat('meeting', Users, { bg: '#eef2ff', fg: '#4338ca', border: '#c7d2fe', dot: '#6366f1' }),
  cat('birthday', Cake, { bg: '#fdf2f8', fg: '#be185d', border: '#fbcfe8', dot: '#ec4899' }),
  cat('health', HeartPulse, { bg: '#fff1f2', fg: '#be123c', border: '#fecdd3', dot: '#f43f5e' }),
  cat('payment', CreditCard, { bg: '#fffbeb', fg: '#b45309', border: '#fde68a', dot: '#f59e0b' }),
  cat('education', GraduationCap, { bg: '#f0fdfa', fg: '#0f766e', border: '#99f6e4', dot: '#14b8a6' }),
  cat('travel', Plane, { bg: '#ecfeff', fg: '#0e7490', border: '#a5f3fc', dot: '#06b6d4' }),
  cat('sport', Dumbbell, { bg: '#f7fee7', fg: '#4d7c0f', border: '#d9f99d', dot: '#84cc16' }),
  cat('holiday', Sun, { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa', dot: '#f97316' }),
  cat('other', Tag, { bg: '#f8fafc', fg: '#334155', border: '#e2e8f0', dot: '#94a3b8' }),
];

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryOf(id: string | null | undefined): Category {
  return CATEGORY_MAP.get(id ?? '') ?? CATEGORY_MAP.get('other')!;
}

export function categoryLabel(id: string) {
  return tRaw(`cat.${id}`);
}

export type PriorityDef = { id: Priority; chip: ChipColors; readonly label: string };

const prio = (id: Priority, chip: ChipColors): PriorityDef => ({
  id,
  chip,
  get label() {
    return tRaw(`pr.${id}`);
  },
});

export const PRIORITIES: PriorityDef[] = [
  prio('low', { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0', dot: '#94a3b8' }),
  prio('medium', { bg: '#f0f9ff', fg: '#0369a1', border: '#bae6fd', dot: '#0ea5e9' }),
  prio('high', { bg: '#fffbeb', fg: '#b45309', border: '#fde68a', dot: '#f59e0b' }),
  prio('urgent', { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca', dot: '#ef4444' }),
];

export function priorityOf(id: string | null | undefined): PriorityDef {
  return PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];
}

export const REPEATS: { id: Repeat; readonly label: string }[] = (
  ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'] as Repeat[]
).map((id) => ({
  id,
  get label() {
    return tRaw(`rep.${id}`);
  },
}));

/** Unit shown next to the repeat interval ("days", "weeks"…). */
export function repeatUnitLabel(repeat: Repeat) {
  return repeat === 'none' ? '' : tRaw(`unit.${repeat}`);
}

export const REMINDER_OPTIONS: { minutes: number; readonly label: string }[] = [0, 10, 30, 60, 180, 1440, 2880, 10080].map(
  (minutes) => ({
    minutes,
    get label() {
      return tRaw(`rem.${minutes}`);
    },
  }),
);

export function reminderLabel(minutes: number) {
  const found = REMINDER_OPTIONS.find((o) => o.minutes === minutes);
  if (found) return found.label;
  const fmt = (key: string, n: number) => tRaw(key).replace('{n}', String(n));
  if (minutes % 1440 === 0) return fmt('rem.fmt.days', minutes / 1440);
  if (minutes % 60 === 0) return fmt('rem.fmt.hours', minutes / 60);
  return fmt('rem.fmt.mins', minutes);
}

/** Shared-calendar colours: dot (`bg-X-500`) and ring (`border-X-400 bg-X-50 text-X-700`). */
export type CalendarColorDef = { id: CalendarColor; dot: string; ring: ChipColors; readonly label: string };

const color = (id: CalendarColor, dot: string, border: string, bg: string, fg: string): CalendarColorDef => ({
  id,
  dot,
  ring: { bg, fg, border, dot },
  get label() {
    return tRaw(`col.${id}`);
  },
});

export const CALENDAR_COLORS: CalendarColorDef[] = [
  color('violet', '#8b5cf6', '#a78bfa', '#f5f3ff', '#6d28d9'),
  color('sky', '#0ea5e9', '#38bdf8', '#f0f9ff', '#0369a1'),
  color('emerald', '#10b981', '#34d399', '#ecfdf5', '#047857'),
  color('amber', '#f59e0b', '#fbbf24', '#fffbeb', '#b45309'),
  color('rose', '#f43f5e', '#fb7185', '#fff1f2', '#be123c'),
  color('slate', '#64748b', '#94a3b8', '#f8fafc', '#334155'),
];

export function calendarColor(id: string | null | undefined): CalendarColorDef {
  return CALENDAR_COLORS.find((c) => c.id === id) ?? CALENDAR_COLORS[0];
}

export const THEME_SWATCHES: Record<string, string> = {
  aurora: '#8b5cf6',
  sunset: '#f97316',
  forest: '#059669',
  ocean: '#0284c7',
  berry: '#f43f5e',
  mono: '#334155',
};
