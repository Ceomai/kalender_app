import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { asArray, ensureProfile } from "@/lib/server-helpers.server";

const THEMES = ["aurora", "sunset", "forest", "ocean", "berry", "mono"];

// Oturum açan kullanıcının temel bilgileri + tercihleri.
export const getMySpace = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const profile = await ensureProfile(base44, context.user);
    return {
      user: {
        id: context.user.id,
        email: context.user.email,
        full_name: context.user.full_name,
      },
      profile,
    };
  });

// Tasarım ve hatırlatma tercihlerini kaydeder.
export const updatePreferences = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      theme: z.enum(THEMES).optional(),
      dark_mode: z.boolean().optional(),
      week_start: z.enum(["mon", "sun"]).optional(),
      density: z.enum(["comfortable", "compact"]).optional(),
      default_view: z.enum(["month", "week", "day", "agenda", "year"]).optional(),
      time_format: z.enum(["24h", "12h"]).optional(),
      email_reminders: z.boolean().optional(),
      default_reminder_minutes: z.number().int().min(0).max(20160).optional(),
      default_category: z.string().max(30).optional(),
      display_name: z.string().trim().min(1).max(60).optional(),
      invite_code: z.string().trim().min(4).max(12).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const profile = await ensureProfile(base44, context.user);
    const patch = { ...data };
    if (patch.invite_code) patch.invite_code = patch.invite_code.toUpperCase();
    return base44.entities.Profile.update(profile.id, patch);
  });

// Yeni bir davet kodu üretir (arkadaşlık daveti).
export const rotateInviteCode = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const profile = await ensureProfile(base44, context.user);
    const { randomCode } = await import("@/lib/server-helpers.server");
    return base44.entities.Profile.update(profile.id, { invite_code: randomCode(6) });
  });

// Kullanıcının tüm verisini kalıcı olarak siler (etkinlik, görev, şablon, takvim,
// arkadaşlık, profil). Servis rolüyle çalışır; oturum kapatma istemcide yapılır.
export const wipeAccount = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const svc = context.getBase44().asServiceRole;
    const uid = context.user.id;
    await svc.entities.Event.deleteMany({ owner_id: uid });
    await svc.entities.Task.deleteMany({ created_by_id: uid });
    await svc.entities.EventTemplate.deleteMany({ created_by_id: uid });
    await svc.entities.Calendar.deleteMany({ owner_id: uid });
    await svc.entities.Friendship.deleteMany({ $or: [{ requester_id: uid }, { addressee_id: uid }] });
    const profile = asArray(await svc.entities.Profile.filter({ user_id: uid }, { limit: 1 }))[0];
    if (profile) await svc.entities.Profile.delete(profile.id);
    return { ok: true };
  });