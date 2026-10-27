// Web invitation-fns.js
import { db, requireUserId, rpc, unwrap } from '@/src/services/db';
import type { EventInvitation, InvitationStatus, Result } from '@/src/services/types';

/** Invites friends to an entry; ids that are not my friends are ignored. */
export async function inviteToEvent(
  eventId: string,
  friendIds: string[],
): Promise<Result<{ created: number; skipped: number }>> {
  return rpc('invite_to_event', { p_event_id: eventId, p_friend_ids: friendIds.slice(0, 50) });
}

/** Answers an invitation; accepting adds the entry to my calendar. */
export async function respondToInvitation(
  invitationId: string,
  status: Exclude<InvitationStatus, 'pending'>,
): Promise<Result> {
  return rpc('respond_to_invitation', { p_invitation_id: invitationId, p_status: status });
}

/** Invitations sent to me that I have not answered yet. */
export async function listPendingInvitations(): Promise<EventInvitation[]> {
  const me = await requireUserId();
  return unwrap(
    await db()
      .from('event_invitations')
      .select('*')
      .eq('invitee_id', me)
      .eq('status', 'pending')
      .order('event_start')
      .limit(100),
  );
}

/** The invitations I sent for one entry, with their status. */
export async function listEventInvitations(eventId: string): Promise<EventInvitation[]> {
  const me = await requireUserId();
  return unwrap(
    await db()
      .from('event_invitations')
      .select('*')
      .eq('event_id', eventId)
      .eq('inviter_id', me)
      .order('created_date', { ascending: false })
      .limit(100),
  );
}
