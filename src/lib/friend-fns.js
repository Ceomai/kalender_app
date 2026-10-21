import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { asArray, displayNameOf } from "@/lib/server-helpers.server";

// Arkadaş listesi (kendi kayıtlarım).
export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;
    const page = await base44.entities.Friendship.filter({}, { sort: "-created_date", limit: 200 });
    return page.items.map((f) => {
      const other =
        f.requester_id === me
          ? { id: f.addressee_id, name: f.addressee_name }
          : { id: f.requester_id, name: f.requester_name };
      return { id: f.id, friend_id: other.id, name: other.name || "Arkadaş", created_date: f.created_date };
    });
  });

// Davet kodu ile arkadaş ekleme.
export const addFriendByCode = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ code: z.string().trim().min(4).max(12) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;
    const code = data.code.trim().toUpperCase();

    const found = asArray(
      await base44.asServiceRole.entities.Profile.filter({ invite_code: code }, { limit: 1 }),
    )[0];
    if (!found) return { ok: false, reason: "not_found" };
    if (found.user_id === me) return { ok: false, reason: "self" };

    const mine = await base44.entities.Friendship.filter({}, { limit: 200 });
    const already = mine.items.some((f) => f.requester_id === found.user_id || f.addressee_id === found.user_id);
    if (already) return { ok: false, reason: "exists" };

    const myName = await displayNameOf(base44, context.user);
    await base44.entities.Friendship.create({
      requester_id: me,
      requester_name: myName,
      addressee_id: found.user_id,
      addressee_name: found.display_name || "Arkadaş",
      status: "accepted",
    });
    return { ok: true, friend: { id: found.user_id, name: found.display_name || "Arkadaş" } };
  });

// Arkadaşlığı kaldırır.
export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.Friendship.delete(data.id);
    return { ok: true };
  });