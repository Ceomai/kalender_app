import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { displayNameOf } from "@/lib/server-helpers.server";

const PRIORITIES = ["low", "medium", "high", "urgent"];

// Kullanıcının şablonları.
export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const page = await context
      .getBase44()
      .entities.EventTemplate.filter({}, { sort: "-created_date", limit: 100 });
    return page.items;
  });

// Yeni şablon.
export const createTemplate = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      name: z.string().trim().min(1).max(80),
      title: z.string().trim().min(1).max(120),
      description: z.string().max(2000).optional(),
      location: z.string().max(160).optional(),
      category: z.string().max(30).optional(),
      priority: z.enum(PRIORITIES).optional(),
      duration_minutes: z.number().int().min(5).max(1440).optional(),
      all_day: z.boolean().optional(),
      reminder_minutes: z.number().int().min(0).max(20160).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    return context.getBase44().entities.EventTemplate.create({
      name: data.name,
      title: data.title,
      description: data.description || "",
      location: data.location || "",
      category: data.category || "personal",
      priority: data.priority || "medium",
      duration_minutes: data.duration_minutes || 60,
      all_day: !!data.all_day,
      reminder_minutes: data.reminder_minutes ?? 30,
    });
  });

// Şablon silme.
export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.EventTemplate.delete(data.id);
    return { ok: true };
  });

// Şablonu bir etkinliğe dönüştürür (varsayılan: gelecek tam saatte başlar).
export const applyTemplate = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), start_at: z.string().min(10).optional() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const user = context.user;
    const tpl = await base44.entities.EventTemplate.get(data.id).catch(() => null);
    if (!tpl) throw new Error("Şablon bulunamadı");

    const start = data.start_at
      ? new Date(data.start_at)
      : new Date(Math.ceil(Date.now() / 3600000 + 1) * 3600000);
    const end = new Date(start.getTime() + (tpl.duration_minutes || 60) * 60000);
    const myName = await displayNameOf(base44, user);

    return base44.entities.Event.create({
      title: tpl.title,
      description: tpl.description || "",
      start_at: start.toISOString(),
      end_at: tpl.all_day ? null : end.toISOString(),
      all_day: !!tpl.all_day,
      category: tpl.category || "personal",
      priority: tpl.priority || "medium",
      location: tpl.location || "",
      repeat: "none",
      reminder_minutes: [tpl.reminder_minutes ?? 30],
      email_reminder: false,
      email_recipients: [],
      email_sent: false,
      done: false,
      calendar_id: "",
      calendar_name: "",
      calendar_color: "",
      owner_id: user.id,
      owner_name: myName,
      visible_to: [user.id],
    });
  });