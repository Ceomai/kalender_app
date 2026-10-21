import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { displayNameOf } from "@/lib/server-helpers.server";
import { parseICS } from "@/lib/ics-parser.server";

// Yüklenen .ics dosyasını okuyup etkinlikleri içe aktarır.
// file_uri: UploadPrivateFile'tan dönen özel dosya URI'si.
export const importICS = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      file_uri: z.string().min(1).max(500),
      calendar_id: z.string().max(60).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const user = context.user;

    // İmzalı URL al ve dosyayı fetch et.
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: data.file_uri,
      expires_in: 120,
    });
    const res = await fetch(signed_url);
    if (!res.ok) throw new Error(`ICS fetch ${res.status}`);
    const text = await res.text();
    if (!text || text.length > 2_000_000) throw new Error("ICS too large");

    const parsed = parseICS(text);
    if (!parsed.length) return { ok: true, created: 0, skipped: 0 };

    // Aynı UID'ye sahip kayıtları atlamak için mevcut external_uid'leri kontrol et.
    const uids = parsed.map((e) => e.external_uid).filter(Boolean);
    let existingUids = new Set();
    if (uids.length) {
      const dupes = await base44.asServiceRole.entities.Event.filter(
        { external_uid: { $in: uids }, created_by_id: user.id },
        { limit: 500, fields: ["external_uid"] },
      );
      existingUids = new Set((dupes.items || []).map((e) => e.external_uid));
    }

    const calendar = data.calendar_id
      ? await base44.entities.Calendar.get(data.calendar_id).catch(() => null)
      : null;
    const members = calendar
      ? Array.from(new Set([user.id, ...(calendar.members || [])]))
      : [user.id];
    const myName = await displayNameOf(base44, user);

    const toCreate = parsed
      .filter((e) => !e.external_uid || !existingUids.has(e.external_uid))
      .map((e) => ({
        title: e.title,
        description: e.description,
        start_at: e.start_at,
        end_at: e.end_at || null,
        all_day: !!e.all_day,
        category: "other",
        priority: "medium",
        location: e.location,
        repeat: e.repeat,
        repeat_interval: 1,
        repeat_end_date: null,
        reminder_minutes: [30],
        email_reminder: false,
        email_recipients: [],
        email_sent: false,
        done: false,
        calendar_id: calendar ? calendar.id : "",
        calendar_name: calendar ? calendar.name : "",
        calendar_color: calendar ? calendar.color : "",
        owner_id: user.id,
        owner_name: myName,
        visible_to: members,
        external_uid: e.external_uid || "",
      }));

    const skipped = parsed.length - toCreate.length;
    let created = 0;
    if (toCreate.length) {
      const result = await base44.entities.Event.bulkCreate(toCreate);
      created = result.records?.length || toCreate.length;
    }
    return { ok: true, created, skipped };
  });