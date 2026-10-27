// Web friend-fns.js
import { db, requireUserId, rpc, unwrap } from '@/src/services/db';
import type { Friendship, Result } from '@/src/services/types';

export type Friend = { id: string; friend_id: string; name: string; created_date: string };

/** A friendship row seen from `me`: the other person's id and name. */
export function toFriend(f: Friendship, me: string): Friend {
  const other =
    f.requester_id === me
      ? { id: f.addressee_id, name: f.addressee_name }
      : { id: f.requester_id, name: f.requester_name };
  return { id: f.id, friend_id: other.id, name: other.name || 'Arkadaş', created_date: f.created_date };
}

export async function listFriends(): Promise<Friend[]> {
  const me = await requireUserId();
  const rows: Friendship[] = unwrap(
    await db().from('friendships').select('*').order('created_date', { ascending: false }).limit(200),
  );
  return rows.map((f) => toFriend(f, me));
}

export async function addFriendByCode(code: string): Promise<Result<{ friend: { id: string; name: string } }>> {
  return rpc('add_friend_by_code', { p_code: code });
}

/** Removes a friendship (by the friendship row id). */
export async function removeFriend(id: string): Promise<{ ok: true }> {
  unwrap(await db().from('friendships').delete().eq('id', id));
  return { ok: true };
}
