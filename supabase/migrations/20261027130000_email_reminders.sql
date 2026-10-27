-- E-mail reminders (replaces the Base44 `reminderEmails` scheduled function).
--
-- The `reminder-emails` Edge Function runs every 5 minutes and calls
-- claim_due_email_reminders(), which picks the occurrences whose first reminder time
-- has come, records them as sent (so parallel runs never double-send) and returns one
-- row per opted-in recipient. Compared with Base44 it also covers the later
-- occurrences of repeating entries and leads up to a week (Base44 looked 48 h ahead).

create table public.email_reminder_log (
  event_id uuid not null references public.events (id) on delete cascade,
  occurrence_start timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (event_id, occurrence_start)
);

alter table public.email_reminder_log enable row level security;
revoke all on public.email_reminder_log from anon, authenticated;

-- Occurrences of one entry starting in [p_from, p_to]; repeats step from the first start
-- (monthly steps clamp to the month's last day, as Postgres interval arithmetic does).
create or replace function public.event_occurrences(e public.events, p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql
stable
set search_path = ''
as $$
  with params as (
    select
      case e.repeat when 'daily' then 1 when 'weekly' then 7 when 'biweekly' then 14 end * e.repeat_interval as step_days,
      case e.repeat when 'monthly' then 1 when 'yearly' then 12 end * e.repeat_interval as step_months,
      least(p_to, coalesce((e.repeat_end_date + 1)::timestamptz, p_to)) as until
  )
  select e.start_at
  where e.repeat = 'none' and e.start_at between p_from and p_to
  union all
  select e.start_at + make_interval(days => k * p.step_days)
  from params p,
    generate_series(
      greatest(0, ceil(extract(epoch from (p_from - e.start_at)) / (p.step_days * 86400.0))::int),
      floor(extract(epoch from (p.until - e.start_at)) / (p.step_days * 86400.0))::int
    ) as k
  where p.step_days is not null
  union all
  select o
  from params p,
    lateral (
      select e.start_at + make_interval(months => k * p.step_months) as o
      from generate_series(
        greatest(
          0,
          ((extract(year from p_from) - extract(year from e.start_at)) * 12
            + extract(month from p_from) - extract(month from e.start_at))::int / p.step_months - 1
        ),
        greatest(
          0,
          ((extract(year from p_from) - extract(year from e.start_at)) * 12
            + extract(month from p_from) - extract(month from e.start_at))::int / p.step_months - 1
        ) + 3
      ) as k
    ) as months
  where p.step_months is not null and months.o between p_from and p.until;
$$;

create or replace function public.claim_due_email_reminders(p_now timestamptz default now())
returns table (
  event_id uuid,
  occurrence_start timestamptz,
  title text,
  description text,
  location text,
  category text,
  calendar_name text,
  email text,
  language text
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
  with due as (
    select e.id, o.occ as occurrence_start
    from public.events e
    cross join lateral public.event_occurrences(e, p_now, p_now + interval '8 days') as o (occ)
    where e.email_reminder
      and not e.done
      -- Fire at the earliest reminder (the largest lead).
      and o.occ - make_interval(mins => (select coalesce(max(m), 30) from unnest(e.reminder_minutes) m)) <= p_now
  ),
  claimed as (
    insert into public.email_reminder_log (event_id, occurrence_start)
    select d.id, d.occurrence_start from due d
    on conflict do nothing
    returning email_reminder_log.event_id, email_reminder_log.occurrence_start
  )
  select e.id, c.occurrence_start, e.title, e.description, e.location, e.category, e.calendar_name,
    u.email::text, p.language
  from claimed c
  join public.events e on e.id = c.event_id
  cross join lateral unnest(array(select distinct x from unnest(e.email_recipients || e.owner_id) x)) as r (user_id)
  join public.profiles p on p.user_id = r.user_id and p.email_reminders
  join auth.users u on u.id = r.user_id and u.email is not null;
end;
$$;

-- Lets the function hand back a claim it could not deliver (e.g. the mail API was down).
create or replace function public.release_email_reminder(p_event_id uuid, p_occurrence_start timestamptz)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.email_reminder_log
  where event_id = p_event_id and occurrence_start = p_occurrence_start;
$$;

revoke execute on function public.event_occurrences(public.events, timestamptz, timestamptz),
  public.claim_due_email_reminders(timestamptz),
  public.release_email_reminder(uuid, timestamptz)
  from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.claim_due_email_reminders(timestamptz),
      public.release_email_reminder(uuid, timestamptz) to service_role;
  end if;
end;
$$;

-- Every 5 minutes, call the Edge Function (hosted Supabase only: pg_cron + pg_net + Vault).
-- It reads the project URL and the service role key from Vault; see supabase/README.md.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_cron;
    create extension if not exists pg_net;
    perform cron.schedule(
      'reminder-emails',
      '*/5 * * * *',
      -- Does nothing until both Vault secrets exist (so no failed calls before setup).
      $cron$
        select net.http_post(
          url := s.url || '/functions/v1/reminder-emails',
          headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || s.key),
          body := '{}'::jsonb
        )
        from (
          select
            (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') as url,
            (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key') as key
        ) as s
        where s.url is not null and s.key is not null;
      $cron$
    );
  end if;
end;
$$;
