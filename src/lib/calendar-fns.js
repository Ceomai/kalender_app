import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { asArray, displayNameOf, randomCode } from "@/lib/server-helpers.server";

const COLORS = ["violet", "sky", "emerald", "amber", "rose", "slate"];

// Üye olduğum takvimler.
export const listCalendars = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const page = await context
      .getBase44()
      .entities.Calendar.filter({}, { sort: "-created_date", limit: 100 });
    return page.items;
  });

// Yeni ortak takvim oluşturur.
export const createCalendar = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      name: z.string().trim().min(1).max(60),
      description: z.string().trim().max(300).optional(),
      color: z.enum(COLORS).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const myName = await displayNameOf(base44, context.user);
    return base44.entities.Calendar.create({
      name: data.name,
      description: data.description || "",
      color: data.color || "violet",
      owner_id: context.user.id,
      owner_name: myName,
      members: [context.user.id],
      member_names: [myName],
      invite_code: randomCode(6),
    });
  });

// Davet kodu ile ortak takvime katılır.
export const joinCalendarByCode = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ code: z.string().trim().min(4).max(12) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;
    const code = data.code.trim().toUpperCase();

    const found = asArray(
      await base44.asServiceRole.entities.Calendar.filter({ invite_code: code }, { limit: 1 }),
    )[0];
    if (!found) return { ok: false, reason: "not_found" };
    if ((found.members || []).includes(me)) return { ok: false, reason: "already" };

    const myName = await displayNameOf(base44, context.user);
    const members = [...(found.members || []), me];
    const memberNames = [...(found.member_names || []), myName];
    const calendar = await base44.asServiceRole.entities.Calendar.update(found.id, {
      members,
      member_names: memberNames,
    });

    // Yeni üyenin, takvimdeki mevcut kayıtları görebilmesi için görünürlüğü güncelle.
    let page = await base44.asServiceRole.entities.Event.updateMany(
      { calendar_id: found.id, visible_to: { $ne: me } },
      { $addToSet: { visible_to: me } },
    );
    let guard = 0;
    while (page?.has_more && guard < 10) {
      page = await base44.asServiceRole.entities.Event.updateMany(
        { calendar_id: found.id, visible_to: { $ne: me } },
        { $addToSet: { visible_to: me } },
      );
      guard++;
    }
    return { ok: true, calendar };
  });

// Ortak takvimden ayrılır (kurucu ise sahiplik devreder veya takvimi siler).
export const leaveCalendar = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const me = context.user.id;
    const calendar = await base44.asServiceRole.entities.Calendar.get(data.id).catch(() => null);
    if (!calendar) return { ok: false, reason: "not_found" };
    if (!(calendar.members || []).includes(me)) return { ok: false, reason: "not_member" };

    const restIds = (calendar.members || []).filter((id) => id !== me);
    const restNames = (calendar.member_names || []).filter((_, i) => (calendar.members || [])[i] !== me);

    if (calendar.owner_id === me) {
      if (restIds.length === 0) {
        await base44.asServiceRole.entities.Event.deleteMany({ calendar_id: calendar.id });
        await base44.asServiceRole.entities.Calendar.delete(calendar.id);
        return { ok: true, removed: true };
      }
      await base44.asServiceRole.entities.Calendar.update(calendar.id, {
        owner_id: restIds[0],
        owner_name: restNames[0] || "Kurucu",
        members: restIds,
        member_names: restNames,
      });
      return { ok: true, removed: false };
    }

    await base44.asServiceRole.entities.Calendar.update(calendar.id, {
      members: restIds,
      member_names: restNames,
    });
    return { ok: true, removed: false };
  });

// Takvimi ve içindeki kayıtları siler (yalnızca kurucu).
export const deleteCalendar = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const calendar = await base44.asServiceRole.entities.Calendar.get(data.id).catch(() => null);
    if (!calendar) return { ok: false, reason: "not_found" };
    if (calendar.owner_id !== context.user.id) return { ok: false, reason: "forbidden" };
    await base44.asServiceRole.entities.Event.deleteMany({ calendar_id: calendar.id });
    await base44.asServiceRole.entities.Calendar.delete(calendar.id);
    return { ok: true };
  });