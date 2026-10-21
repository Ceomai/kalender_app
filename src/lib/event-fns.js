import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { displayNameOf } from "@/lib/server-helpers.server";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const REPEATS = ["none", "daily", "weekly", "biweekly", "monthly", "yearly"];

const baseFields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  start_at: z.string().min(10),
  end_at: z.string().min(10).nullable().optional(),
  all_day: z.boolean().optional(),
  category: z.string().max(30).optional(),
  priority: z.enum(PRIORITIES).optional(),
  location: z.string().max(160).optional(),
  repeat: z.enum(REPEATS).optional(),
  repeat_interval: z.number().int().min(1).max(365).optional(),
  repeat_end_date: z.string().nullable().optional(),
  reminder_minutes: z.array(z.number().int().min(0).max(20160)).max(5).optional(),
  email_reminder: z.boolean().optional(),
  email_all_members: z.boolean().optional(),
  calendar_id: z.string().nullable().optional(),
};

// Belirli bir tarih aralığındaki kayıtlar (tekrarlar dahil).
export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(
    z.object({
      from: z.string().min(10),
      to: z.string().min(10),
      categories: z.array(z.string().max(30)).max(20).optional(),
      priority: z.enum(PRIORITIES).optional(),
      calendarId: z.string().max(60).optional(),
      search: z.string().trim().max(60).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const query = {
      $or: [
        { start_at: { $gte: data.from, $lt: data.to } },
        { repeat: { $in: ["daily", "weekly", "monthly", "yearly"] } },
      ],
    };
    if (data.categories && data.categories.length) query.category = { $in: data.categories };
    if (data.priority) query.priority = data.priority;
    if (data.calendarId) query.calendar_id = data.calendarId;
    if (data.search) query.title = { $regex: data.search, $options: "i" };

    const page = await context
      .getBase44()
      .entities.Event.filter(query, { sort: "start_at", limit: 500 });
    return page.items;
  });

// Hatırlatma zili için yaklaşan kayıtlar.
export const listUpcoming = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ days: z.number().int().min(1).max(30).optional() }))
  .handler(async ({ data, context }) => {
    const from = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + (data.days || 7) * 86400000).toISOString();
    const page = await context.getBase44().entities.Event.filter(
      { start_at: { $gte: from, $lt: to }, done: { $ne: true } },
      { sort: "start_at", limit: 60 },
    );
    return page.items;
  });

// Yeni kayıt (kişisel veya ortak takvimde).
export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object(baseFields))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const user = context.user;
    const calendar = data.calendar_id
      ? await base44.entities.Calendar.get(data.calendar_id).catch(() => null)
      : null;
    const myName = await displayNameOf(base44, user);
    const members = calendar
      ? Array.from(new Set([user.id, ...(calendar.members || [])]))
      : [user.id];

    return base44.entities.Event.create({
      title: data.title,
      description: data.description || "",
      start_at: data.start_at,
      end_at: data.end_at || null,
      all_day: !!data.all_day,
      category: data.category || "personal",
      priority: data.priority || "medium",
      location: data.location || "",
      repeat: data.repeat || "none",
      repeat_interval: data.repeat_interval || 1,
      repeat_end_date: data.repeat_end_date || null,
      reminder_minutes:
        data.reminder_minutes && data.reminder_minutes.length ? data.reminder_minutes : [30],
      email_reminder: !!data.email_reminder,
      email_recipients: data.email_reminder
        ? data.email_all_members && calendar
          ? members
          : [user.id]
        : [],
      email_sent: false,
      done: false,
      calendar_id: calendar ? calendar.id : "",
      calendar_name: calendar ? calendar.name : "",
      calendar_color: calendar ? calendar.color : "",
      owner_id: user.id,
      owner_name: myName,
      visible_to: members,
    });
  });

// Kayıt güncelleme.
export const updateEvent = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      title: baseFields.title.optional(),
      description: baseFields.description,
      start_at: baseFields.start_at.optional(),
      end_at: baseFields.end_at,
      all_day: baseFields.all_day,
      category: baseFields.category,
      priority: baseFields.priority,
      location: baseFields.location,
      repeat: baseFields.repeat,
      repeat_interval: baseFields.repeat_interval,
      repeat_end_date: baseFields.repeat_end_date,
      reminder_minutes: baseFields.reminder_minutes,
      email_reminder: baseFields.email_reminder,
      email_all_members: baseFields.email_all_members,
      calendar_id: baseFields.calendar_id,
      done: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const user = context.user;
    const { id, email_all_members: emailAll, ...rest } = data;
    const patch = { ...rest };

    if ("calendar_id" in rest) {
      const calendar = rest.calendar_id
        ? await base44.entities.Calendar.get(rest.calendar_id).catch(() => null)
        : null;
      const members = calendar
        ? Array.from(new Set([user.id, ...(calendar.members || [])]))
        : [user.id];
      patch.calendar_id = calendar ? calendar.id : "";
      patch.calendar_name = calendar ? calendar.name : "";
      patch.calendar_color = calendar ? calendar.color : "";
      patch.visible_to = members;
      patch.email_recipients = patch.email_reminder
        ? emailAll && calendar
          ? members
          : [user.id]
        : [];
    } else if ("email_reminder" in rest) {
      patch.email_recipients = rest.email_reminder ? [user.id] : [];
    }

    if ("email_reminder" in rest || "start_at" in rest || "reminder_minutes" in rest) {
      patch.email_sent = false;
    }
    return base44.entities.Event.update(id, patch);
  });

// Tek bir oluşumu tamamlandı olarak işaretler.
export const setEventDone = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), done: z.boolean() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    return base44.entities.Event.update(data.id, { done: data.done });
  });

// Kaydı siler (tekrarlıysa tüm seri).
export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.Event.delete(data.id);
    return { ok: true };
  });