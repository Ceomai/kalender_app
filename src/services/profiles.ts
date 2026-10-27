// Web profile-fns.js
import { db, requireUserId, rpc, unwrap } from '@/src/services/db';
import type { Profile } from '@/src/services/types';

export type PreferencePatch = Partial<
  Pick<
    Profile,
    | 'theme'
    | 'dark_mode'
    | 'week_start'
    | 'density'
    | 'default_view'
    | 'time_format'
    | 'email_reminders'
    | 'default_reminder_minutes'
    | 'default_category'
    | 'display_name'
    | 'invite_code'
    | 'language'
  >
>;

export type MySpace = {
  user: { id: string; email: string | undefined; full_name: string | undefined };
  profile: Profile;
};

/** The signed-in user and their profile (created on first call). */
export async function getMySpace(): Promise<MySpace> {
  const { data } = await db().auth.getUser();
  if (!data.user) throw new Error('not_authenticated');
  const profile = await rpc<Profile>('ensure_profile');
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name as string | undefined,
    },
    profile,
  };
}

/** Saves design and reminder preferences (and the display name / invite code). */
export async function updatePreferences(patch: PreferencePatch): Promise<Profile> {
  const me = await requireUserId();
  const data = { ...patch };
  if (data.display_name !== undefined) data.display_name = data.display_name.trim().slice(0, 60);
  if (data.invite_code !== undefined) data.invite_code = data.invite_code.trim().toUpperCase();
  return unwrap(await db().from('profiles').update(data).eq('user_id', me).select().single());
}

/** New friend invite code. */
export async function rotateInviteCode(): Promise<Profile> {
  return rpc<Profile>('rotate_invite_code');
}

/** Deletes the account and all its data; the caller signs out afterwards. */
export async function wipeAccount(): Promise<{ ok: true }> {
  return rpc<{ ok: true }>('delete_account');
}
