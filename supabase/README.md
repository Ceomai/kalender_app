# Supabase (Takvimim backend)

Replaces the Base44 backend: Postgres tables with row level security, Supabase Auth,
and a few `SECURITY DEFINER` functions for what Base44 did with `asServiceRole`.

## Contents

| Path | What |
|---|---|
| `migrations/…_core_schema.sql` | 7 tables (profiles, calendars, events, event_invitations, event_templates, friendships, tasks), triggers, RLS, column grants |
| `migrations/…_rpc.sql` | `ensure_profile`, `rotate_invite_code`, `join_calendar_by_code`, `leave_calendar`, `add_friend_by_code`, `invite_to_event`, `respond_to_invitation`, `delete_account` |
| `templates/` | Sign-up and recovery mails carrying the 6-digit code (`{{ .Token }}`) |
| `tests/rls.test.mjs` | Runs the migrations in PGlite and checks RLS / grants / RPCs as three users (`npm run test:db`) |
| `config.toml` | Supabase CLI config (auth settings, redirect URLs, templates) |

### Differences from Base44 (on purpose)

- Derived columns (`owner_id`, `owner_name`, `visible_to`, `calendar_name/color`, calendar
  `members`) are set by triggers and cannot be written by the app.
- Only the event owner or a member of its shared calendar can delete an event (Base44 let any
  viewer, including accepted invitees, delete it).
- Leaving a shared calendar also hides the other members' entries of that calendar.
- `delete_account` deletes the auth user too; everything else cascades.
- Only the calendar owner can rename/recolour it.

## Setting up a project (one-time)

1. Create a project at <https://supabase.com/dashboard> (region close to users, e.g. Frankfurt).
2. Link and push the schema from the repository root:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   npx supabase config push
   ```

   `config push` applies `config.toml`'s auth settings (confirmations, password length,
   redirect URLs, the two e-mail templates). They can also be set by hand in
   Dashboard → Authentication.
3. Copy `.env.example` to `.env` and fill in the project URL and the **anon** key
   (Dashboard → Project Settings → API). Never put the `service_role` key in the app.
4. E-mail: the built-in mailer sends only a few mails per hour. Before inviting testers, set a
   custom SMTP server (Dashboard → Authentication → SMTP).

### E-mail reminders

Mails go through [Resend](https://resend.com) (free tier: 100 mails/day). `claim_due_email_reminders()`
picks what is due; the `reminder-emails` Edge Function sends it; pg_cron calls the function every 5 minutes
(set up by the `…_email_reminders` migration).

1. Resend: verify a sending domain and create an API key.
2. Secrets and deploy (from the repository root):

   ```bash
   npx supabase secrets set RESEND_API_KEY=re_xxx REMINDER_FROM="Takvimim <hatirlatma@alanadiniz.com>"
   npx supabase functions deploy reminder-emails --no-verify-jwt
   ```

   (The function checks the service role key itself, so the gateway's JWT check is off.)
3. Give the scheduler the project URL and service role key (Dashboard → SQL editor, once):

   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<service_role key>', 'service_role_key');
   ```

The same SMTP/Resend setup also lets you turn the 6-digit code templates back on (`config.toml`).

### Google sign-in (optional)

1. Google Cloud Console → OAuth client (type *Web application*); authorised redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Dashboard → Authentication → Providers → Google: paste the client ID and secret.
3. Redirect URLs already allow `takvimim://auth/callback` (and `exp://**` for Expo Go).

## Local checks

```bash
npm run test:db   # migrations + RLS scenarios in PGlite, no Docker needed
```

With Docker Desktop running, `npx supabase start` serves the whole stack locally
(Studio on http://127.0.0.1:54323, Inbucket for test mails on http://127.0.0.1:54324).
