import { createClientFromRequest } from "npm:@base44/sdk";

const asArray = (res) => (Array.isArray(res) ? res : res?.items ?? []);

const CATEGORY_LABELS = {
  personal: "Kişisel",
  work: "İş",
  meeting: "Toplantı",
  birthday: "Doğum günü",
  health: "Sağlık",
  payment: "Ödeme",
  education: "Eğitim",
  travel: "Seyahat",
  sport: "Spor",
  holiday: "Tatil",
  other: "Diğer",
};

function formatWhen(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${date} · ${time} (UTC)`;
}

// E-posta hatırlatmalarını gönderir. Her 5 dakikada bir çalışır.
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const now = Date.now();
  const from = new Date(now - 5 * 60 * 1000).toISOString();
  const to = new Date(now + 48 * 3600 * 1000).toISOString();

  const events = asArray(
    await base44.asServiceRole.entities.Event.filter(
      {
        email_reminder: true,
        email_sent: { $ne: true },
        start_at: { $gte: from, $lt: to },
      },
      { limit: 200 },
    ),
  );

  let sent = 0;
  let skipped = 0;
  const details = [];

  for (const ev of events) {
    const startMs = new Date(ev.start_at).getTime();
    const leads = Array.isArray(ev.reminder_minutes) && ev.reminder_minutes.length ? ev.reminder_minutes : [30];
    const lead = Math.min(...leads.map((n) => Number(n) || 0));
    const reminderAt = startMs - lead * 60000;

    // Zamanı gelmediyse bekle; başlangıç saati geçtiyse tekrar bakmayı bırak.
    if (now >= startMs) {
      await base44.asServiceRole.entities.Event.update(ev.id, { email_sent: true });
      skipped++;
      continue;
    }
    if (now < reminderAt) continue;

    const ids = Array.from(new Set([...(ev.email_recipients || []), ev.owner_id].filter(Boolean)));
    if (ids.length === 0) {
      await base44.asServiceRole.entities.Event.update(ev.id, { email_sent: true });
      skipped++;
      continue;
    }

    const [users, profiles] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ id: { $in: ids } }, { limit: 50 }),
      base44.asServiceRole.entities.Profile.filter({ user_id: { $in: ids } }, { limit: 50 }),
    ]);
    const optedIn = new Set(asArray(profiles).filter((p) => p.email_reminders === true).map((p) => p.user_id));

    const category = CATEGORY_LABELS[ev.category] || "Diğer";
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#18181b">
        <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;margin:0 0 6px">Hatırlatma</p>
        <h2 style="margin:0 0 12px;font-size:22px">${ev.title}</h2>
        <p style="margin:0 0 4px"><strong>Tarih:</strong> ${formatWhen(ev.start_at)}</p>
        <p style="margin:0 0 4px"><strong>Kategori:</strong> ${category}</p>
        ${ev.location ? `<p style="margin:0 0 4px"><strong>Yer:</strong> ${ev.location}</p>` : ""}
        ${ev.calendar_name ? `<p style="margin:0 0 4px"><strong>Takvim:</strong> ${ev.calendar_name}</p>` : ""}
        ${ev.description ? `<p style="margin:12px 0 0;white-space:pre-line">${ev.description}</p>` : ""}
      </div>`;

    for (const user of asArray(users)) {
      if (!user?.email || !optedIn.has(user.id)) continue;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `Hatırlatma: ${ev.title}`,
        body: html,
        from_name: "Takvimim",
      });
      sent++;
      details.push(`${ev.title} → ${user.email}`);
    }

    await base44.asServiceRole.entities.Event.update(ev.id, { email_sent: true });
  }

  return Response.json({ scanned: events.length, sent, skipped, details });
}