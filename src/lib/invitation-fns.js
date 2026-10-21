import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

// server-helpers.server doğrudan import edilmez (import-protection).
async function displayNameOf(base44, user) {
  const page = await base44.entities.Profile.filter({ user_id: user.id }, { limit: 1 });
  const profile = (page.items || [])[0];
  return profile?.display_name || user.full_name || (user.email || "").split("@")[0] || "Kullanıcı";
}

// Bir etkinliğe arkadaş davet eder (arkadaş listesinden çoklu seçim).
// Kabul edilen davetlileri etkinliğin visible_to'suna ekler.
export const inviteToEvent = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      event_id: z.string().min(1),
      friend_ids: z.array(z.string()).min(1).max(50),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;
    const myName = await displayNameOf(base44, context.user);

    const event = await base44.entities.Event.get(data.event_id).catch(() => null);
    if (!event) return { ok: false, reason: "no_event" };

    // Arkadaş listemden gelen id'leri doğrula.
    const myFriendships = await base44.entities.Friendship.filter({}, { limit: 200 });
    const friendIds = new Set(
      myFriendships.items.map((f) => (f.requester_id === me ? f.addressee_id : f.requester_id)),
    );
    const validIds = data.friend_ids.filter((id) => friendIds.has(id));
    if (!validIds.length) return { ok: false, reason: "no_friends" };

    // Mevcut davetleri atla.
    const existing = await base44.entities.EventInvitation.filter(
      { event_id: data.event_id, invitee_id: { $in: validIds } },
      { limit: 100, fields: ["invitee_id"] },
    );
    const existingIds = new Set((existing.items || []).map((i) => i.invitee_id));
    const toInvite = validIds.filter((id) => !existingIds.has(id));
    if (!toInvite.length) return { ok: true, created: 0, skipped: validIds.length };

    // Davet kayıtları oluştur.
    const invitations = toInvite.map((id) => {
      const f = myFriendships.items.find(
        (fr) => (fr.requester_id === me && fr.addressee_id === id) || (fr.addressee_id === me && fr.requester_id === id),
      );
      const inviteeName = f
        ? f.requester_id === me
          ? f.addressee_name
          : f.requester_name
        : "Arkadaş";
      return {
        event_id: data.event_id,
        event_title: event.title || "",
        event_start: event.start_at || "",
        inviter_id: me,
        inviter_name: myName,
        invitee_id: id,
        invitee_name: inviteeName || "Arkadaş",
        status: "pending",
      };
    });

    const result = await base44.entities.EventInvitation.bulkCreate(invitations);
    return { ok: true, created: result.records?.length || toInvite.length, skipped: existingIds.size };
  });

// Davete yanıt verir. Kabul edilen davetliyi etkinliğin visible_to'suna ekler.
export const respondToInvitation = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      invitation_id: z.string().min(1),
      status: z.enum(["accepted", "declined", "tentative"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;

    const invitation = await base44.entities.EventInvitation.get(data.invitation_id).catch(() => null);
    if (!invitation) return { ok: false, reason: "not_found" };
    if (invitation.invitee_id !== me) return { ok: false, reason: "not_yours" };

    await base44.entities.EventInvitation.update(data.invitation_id, {
      status: data.status,
      responded_at: new Date().toISOString(),
    });

    // Kabul edilen davetliyi etkinliğin visible_to'suna ekle. Davetli, daveti
    // kabul etmeden etkinliği okuma/yazma yetkisine sahip değildir (RLS), bu
    // yüzden bu tek adım servis rolüyle yapılır ve çağıran doğrulanmıştır.
    if (data.status === "accepted") {
      const service = base44.asServiceRole;
      const event = await service.entities.Event.get(invitation.event_id).catch(() => null);
      if (event) {
        const visible = Array.isArray(event.visible_to) ? event.visible_to : [];
        if (!visible.includes(me)) {
          await service.entities.Event.update(event.id, { visible_to: [...visible, me] });
        }
      }
    }
    return { ok: true };
  });

// Bekleyen davetlerim (bana gönderilen, henüz yanıt vermediğim).
export const listPendingInvitations = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;
    const page = await base44.entities.EventInvitation.filter(
      { invitee_id: me, status: "pending" },
      { sort: "event_start", limit: 100 },
    );
    return page.items || [];
  });

// Bir etkinliğe ait davet durumları (davet eden görebilir).
export const listEventInvitations = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ event_id: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;
    const page = await base44.entities.EventInvitation.filter(
      { event_id: data.event_id },
      { sort: "-created_date", limit: 100 },
    );
    // Sadeca kendi gönderdiğim davetleri döndür (başkalarının davetleri gizli).
    return (page.items || []).filter((i) => i.inviter_id === me);
  });