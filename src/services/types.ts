// Row types of the Supabase tables (supabase/migrations). Field names match the
// Base44 entities, so code ported from the web reads the same properties.

import type { AppLanguage, CalendarView, Density, ThemeId, TimeFormat, WeekStart } from '@/src/theme/types';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Repeat = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type CalendarColor = 'violet' | 'sky' | 'emerald' | 'amber' | 'rose' | 'slate';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

type Timestamps = {
  id: string;
  created_date: string;
  updated_date: string;
  created_by_id: string | null;
};

export type Profile = Timestamps & {
  user_id: string;
  display_name: string;
  invite_code: string;
  theme: ThemeId;
  dark_mode: boolean;
  week_start: WeekStart;
  density: Density;
  default_view: CalendarView;
  time_format: TimeFormat;
  email_reminders: boolean;
  default_reminder_minutes: number;
  default_category: string;
  language: AppLanguage;
};

export type Calendar = Timestamps & {
  name: string;
  description: string;
  color: CalendarColor;
  owner_id: string;
  owner_name: string;
  members: string[];
  member_names: string[];
  invite_code: string;
};

export type CalendarEvent = Timestamps & {
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  category: string;
  priority: Priority;
  location: string;
  repeat: Repeat;
  repeat_interval: number;
  repeat_end_date: string | null;
  reminder_minutes: number[];
  email_reminder: boolean;
  email_recipients: string[];
  email_sent: boolean;
  done: boolean;
  calendar_id: string | null;
  calendar_name: string;
  calendar_color: string;
  owner_id: string;
  owner_name: string;
  visible_to: string[];
  external_uid: string | null;
};

export type EventInvitation = Timestamps & {
  event_id: string;
  event_title: string;
  event_start: string | null;
  inviter_id: string;
  inviter_name: string;
  invitee_id: string;
  invitee_name: string;
  status: InvitationStatus;
  responded_at: string | null;
};

export type EventTemplate = Timestamps & {
  name: string;
  title: string;
  description: string;
  location: string;
  category: string;
  priority: Priority;
  duration_minutes: number;
  all_day: boolean;
  reminder_minutes: number;
};

export type Friendship = Timestamps & {
  requester_id: string;
  requester_name: string;
  addressee_id: string;
  addressee_name: string;
  status: 'accepted';
};

export type Task = Timestamps & {
  title: string;
  description: string;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  order: number;
};

/** `{ ok, reason }` result the web server functions returned (and the RPCs return). */
export type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; reason: string };
