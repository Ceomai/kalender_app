// Sends due e-mail reminders (replaces Base44's `reminderEmails`). pg_cron calls it every
// 5 minutes with the service role key (see the email_reminders migration).
//
// Secrets (supabase secrets set ...):
//   RESEND_API_KEY      API key of https://resend.com
//   REMINDER_FROM       sender, e.g. "Takvimim <hatirlatma@alanadiniz.com>" (a domain verified in Resend)
//   REMINDER_TIMEZONE   time zone used in the mail text (default Europe/Istanbul)
import { createClient } from 'npm:@supabase/supabase-js@2';

type DueRow = {
  event_id: string;
  occurrence_start: string;
  title: string;
  description: string;
  location: string;
  category: string;
  calendar_name: string;
  email: string;
  language: string;
};

const TEXT = {
  tr: {
    eyebrow: 'Hatırlatma',
    subject: 'Hatırlatma',
    date: 'Tarih',
    category: 'Kategori',
    place: 'Yer',
    calendar: 'Takvim',
    categories: {
      personal: 'Kişisel', work: 'İş', meeting: 'Toplantı', birthday: 'Doğum günü', health: 'Sağlık',
      payment: 'Ödeme', education: 'Eğitim', travel: 'Seyahat', sport: 'Spor', holiday: 'Tatil', other: 'Diğer',
    } as Record<string, string>,
    locale: 'tr-TR',
  },
  en: {
    eyebrow: 'Reminder',
    subject: 'Reminder',
    date: 'When',
    category: 'Category',
    place: 'Where',
    calendar: 'Calendar',
    categories: {
      personal: 'Personal', work: 'Work', meeting: 'Meeting', birthday: 'Birthday', health: 'Health',
      payment: 'Payment', education: 'Education', travel: 'Travel', sport: 'Sport', holiday: 'Holiday', other: 'Other',
    } as Record<string, string>,
    locale: 'en-GB',
  },
};

/** Entry fields are user input: never put them into the HTML unescaped. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function renderEmail(row: DueRow, timeZone: string) {
  const L = row.language === 'en' ? TEXT.en : TEXT.tr;
  const when = new Date(row.occurrence_start).toLocaleString(L.locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone,
  });
  const line = (label: string, value: string) =>
    value ? `<p style="margin:0 0 4px"><strong>${label}:</strong> ${escapeHtml(value)}</p>` : '';
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#18181b">
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;margin:0 0 6px">${L.eyebrow}</p>
      <h2 style="margin:0 0 12px;font-size:22px">${escapeHtml(row.title)}</h2>
      ${line(L.date, when)}
      ${line(L.category, L.categories[row.category] ?? L.categories.other)}
      ${line(L.place, row.location)}
      ${line(L.calendar, row.calendar_name)}
      ${row.description ? `<p style="margin:12px 0 0;white-space:pre-line">${escapeHtml(row.description)}</p>` : ''}
    </div>`;
  return { subject: `${L.subject}: ${row.title}`, html };
}

Deno.serve(async (req) => {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  // Only the scheduler (service role) may trigger sends.
  if (!serviceKey || req.headers.get('Authorization') !== `Bearer ${serviceKey}`) {
    return new Response('forbidden', { status: 403 });
  }
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('REMINDER_FROM');
  if (!apiKey || !from) {
    return Response.json({ error: 'RESEND_API_KEY / REMINDER_FROM not set' }, { status: 503 });
  }
  const timeZone = Deno.env.get('REMINDER_TIMEZONE') ?? 'Europe/Istanbul';

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc('claim_due_email_reminders');
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as DueRow[];
  let sent = 0;
  const failed = new Set<string>();

  for (const row of rows) {
    const { subject, html } = renderEmail(row, timeZone);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: row.email, subject, html }),
    });
    if (res.ok) {
      sent++;
    } else {
      console.error('send failed', row.event_id, res.status, await res.text());
      failed.add(`${row.event_id}|${row.occurrence_start}`);
    }
  }

  // Hand failed occurrences back so the next run retries them (all recipients again).
  for (const key of failed) {
    const [eventId, occurrence] = key.split('|');
    await supabase.rpc('release_email_reminder', { p_event_id: eventId, p_occurrence_start: occurrence });
  }

  return Response.json({ claimed: rows.length, sent, failed: failed.size });
});
