export const THEME_IDS = ['aurora', 'sunset', 'forest', 'ocean', 'berry', 'mono'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type ColorTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
};

export type Density = 'comfortable' | 'compact';
export type WeekStart = 'mon' | 'sun';
export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'year';
export type TimeFormat = '24h' | '12h';
export type AppLanguage = 'tr' | 'en';

export type AppPreferences = {
  theme: ThemeId;
  dark_mode: boolean;
  week_start: WeekStart;
  density: Density;
  default_view: CalendarView;
  time_format: TimeFormat;
  language: AppLanguage;
  display_name: string;
  email_reminders: boolean;
  default_reminder_minutes: number;
  default_category: string;
};

export const DEFAULT_PREFS: AppPreferences = {
  theme: 'aurora',
  dark_mode: false,
  week_start: 'mon',
  density: 'comfortable',
  default_view: 'month',
  time_format: '24h',
  language: 'tr',
  display_name: '',
  email_reminders: false,
  default_reminder_minutes: 30,
  default_category: 'personal',
};
