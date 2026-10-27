-- Takvimim core schema: the seven Base44 entities as Postgres tables.
--
-- Column names follow the Base44 entities (including created_date / updated_date /
-- created_by_id) so the app code and a later data import map one to one.
-- Derived columns (owners, display names, visible_to, calendar_name/color) are set
-- by triggers and are not writable by clients; membership changes go through the
-- SECURITY DEFINER functions in the next migration.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Invite codes: 32-letter alphabet without look-alikes (same as the web's randomCode).
create or replace function public.random_code(len integer default 6)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(len);
  result text := '';
begin
  for i in 0 .. len - 1 loop
    result := result || substr(alphabet, 1 + (get_byte(bytes, i) % 32), 1);
  end loop;
  return result;
end;
$$;

-- Name shown to others when a profile has none: full name, else the e-mail's local part.
create or replace function public.fallback_name(email text, meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    coalesce(
      nullif(trim(meta ->> 'full_name'), ''),
      nullif(split_part(coalesce(email, ''), '@', 1), ''),
      'Kullanıcı'
    ),
    60
  );
$$;

create or replace function public.set_updated_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_date := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (Base44 Profile)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() unique references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  invite_code text not null unique default public.random_code(6)
    check (invite_code ~ '^[A-Z0-9]{4,12}$'),
  theme text not null default 'aurora'
    check (theme in ('aurora', 'sunset', 'forest', 'ocean', 'berry', 'mono')),
  dark_mode boolean not null default false,
  week_start text not null default 'mon' check (week_start in ('mon', 'sun')),
  density text not null default 'comfortable' check (density in ('comfortable', 'compact')),
  default_view text not null default 'month'
    check (default_view in ('month', 'week', 'day', 'agenda', 'year')),
  time_format text not null default '24h' check (time_format in ('24h', '12h')),
  email_reminders boolean not null default false,
  default_reminder_minutes integer not null default 30
    check (default_reminder_minutes between 0 and 20160),
  default_category text not null default 'personal' check (char_length(default_category) <= 30),
  language text not null default 'tr' check (language in ('tr', 'en')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create trigger profiles_updated_date
  before update on public.profiles
  for each row execute function public.set_updated_date();

-- Every new account gets a profile (replaces the web's ensureProfile on first load).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, created_by_id)
  values (new.id, public.fallback_name(new.email, new.raw_user_meta_data), new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The caller's display name, as the web's displayNameOf().
create or replace function public.my_display_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(p.display_name, ''), public.fallback_name(u.email, u.raw_user_meta_data))
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where u.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- calendars (Base44 Calendar — shared calendars)
-- ---------------------------------------------------------------------------

create table public.calendars (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 300),
  color text not null default 'violet'
    check (color in ('violet', 'sky', 'emerald', 'amber', 'rose', 'slate')),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_name text not null default '',
  members uuid[] not null default '{}',
  member_names text[] not null default '{}',
  invite_code text not null unique default public.random_code(6),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create index calendars_members_idx on public.calendars using gin (members);

create or replace function public.calendars_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is not null then
    new.owner_id := me;
    new.created_by_id := me;
    new.owner_name := public.my_display_name();
    new.members := array[me];
    new.member_names := array[new.owner_name];
    new.invite_code := public.random_code(6);
  end if;
  return new;
end;
$$;

create trigger calendars_before_insert
  before insert on public.calendars
  for each row execute function public.calendars_before_insert();

create trigger calendars_updated_date
  before update on public.calendars
  for each row execute function public.set_updated_date();

-- ---------------------------------------------------------------------------
-- events (Base44 Event — personal and shared-calendar entries)
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  category text not null default 'personal' check (char_length(category) <= 30),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  location text not null default '' check (char_length(location) <= 160),
  repeat text not null default 'none'
    check (repeat in ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  repeat_interval integer not null default 1 check (repeat_interval between 1 and 365),
  repeat_end_date date,
  reminder_minutes integer[] not null default '{30}'
    check (
      cardinality(reminder_minutes) <= 5
      and 0 <= all (reminder_minutes)
      and 20160 >= all (reminder_minutes)
    ),
  email_reminder boolean not null default false,
  email_recipients uuid[] not null default '{}',
  email_sent boolean not null default false,
  done boolean not null default false,
  calendar_id uuid references public.calendars (id) on delete cascade,
  calendar_name text not null default '',
  calendar_color text not null default '',
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_name text not null default '',
  visible_to uuid[] not null default '{}',
  external_uid text check (char_length(external_uid) <= 300),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create index events_visible_to_idx on public.events using gin (visible_to);
create index events_start_at_idx on public.events (start_at);
create index events_calendar_id_idx on public.events (calendar_id);
create index events_external_uid_idx on public.events (created_by_id, external_uid)
  where external_uid is not null;

-- Derives owner, calendar snapshot, visible_to and e-mail recipients, exactly as
-- the web's createEvent / updateEvent did on the server.
create or replace function public.events_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  cal public.calendars;
  invitees uuid[] := '{}';
begin
  if tg_op = 'INSERT' and me is not null then
    new.owner_id := me;
    new.created_by_id := me;
    new.owner_name := public.my_display_name();
    new.email_sent := false;
    new.done := coalesce(new.done, false);
  end if;

  if tg_op = 'INSERT' or new.calendar_id is distinct from old.calendar_id then
    if new.calendar_id is not null then
      select * into cal from public.calendars where id = new.calendar_id;
      if not found or (me is not null and not (me = any (cal.members) or me = cal.owner_id)) then
        raise exception 'calendar_forbidden' using errcode = '42501';
      end if;
      new.calendar_name := cal.name;
      new.calendar_color := cal.color;
    else
      new.calendar_name := '';
      new.calendar_color := '';
    end if;

    if tg_op = 'UPDATE' then
      select coalesce(array_agg(i.invitee_id), '{}') into invitees
      from public.event_invitations i
      where i.event_id = new.id and i.status = 'accepted';
    end if;

    -- Service-role inserts (data import) may bring their own visible_to.
    if tg_op = 'UPDATE' or me is not null or cardinality(new.visible_to) = 0 then
      new.visible_to := array(
        select distinct x
        from unnest(array[new.owner_id] || coalesce(cal.members, '{}') || invitees) as x
        where x is not null
      );
    end if;
  end if;

  if new.email_reminder then
    new.email_recipients := array(
      select distinct x from unnest(new.email_recipients) as x where x = any (new.visible_to)
    );
    if cardinality(new.email_recipients) = 0 then
      new.email_recipients := array[new.owner_id];
    end if;
  else
    new.email_recipients := '{}';
  end if;

  if tg_op = 'UPDATE' then
    if new.start_at is distinct from old.start_at
      or new.reminder_minutes is distinct from old.reminder_minutes
      or new.email_reminder is distinct from old.email_reminder then
      new.email_sent := false;
    end if;
    new.updated_date := now();
  end if;

  return new;
end;
$$;

create trigger events_before_write
  before insert or update on public.events
  for each row execute function public.events_before_write();

-- Keep the calendar snapshot on events in sync when a calendar is renamed or recoloured.
create or replace function public.calendars_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.name is distinct from old.name or new.color is distinct from old.color then
    update public.events
    set calendar_name = new.name, calendar_color = new.color
    where calendar_id = new.id;
  end if;
  return new;
end;
$$;

create trigger calendars_after_update
  after update on public.calendars
  for each row execute function public.calendars_after_update();

-- ---------------------------------------------------------------------------
-- event_invitations (Base44 EventInvitation)
-- ---------------------------------------------------------------------------

create table public.event_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  event_title text not null default '',
  event_start timestamptz,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  inviter_name text not null default '',
  invitee_id uuid not null references auth.users (id) on delete cascade,
  invitee_name text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'tentative')),
  responded_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  unique (event_id, invitee_id)
);

create index event_invitations_invitee_idx on public.event_invitations (invitee_id, status);
create index event_invitations_inviter_idx on public.event_invitations (inviter_id);

create trigger event_invitations_updated_date
  before update on public.event_invitations
  for each row execute function public.set_updated_date();

-- ---------------------------------------------------------------------------
-- event_templates (Base44 EventTemplate)
-- ---------------------------------------------------------------------------

create table public.event_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  location text not null default '' check (char_length(location) <= 160),
  category text not null default 'personal' check (char_length(category) <= 30),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  duration_minutes integer not null default 60 check (duration_minutes between 0 and 10080),
  all_day boolean not null default false,
  reminder_minutes integer not null default 30 check (reminder_minutes between 0 and 20160),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid not null default auth.uid() references auth.users (id) on delete cascade
);

create index event_templates_owner_idx on public.event_templates (created_by_id);

create trigger event_templates_updated_date
  before update on public.event_templates
  for each row execute function public.set_updated_date();

-- ---------------------------------------------------------------------------
-- friendships (Base44 Friendship — always "accepted", created by invite code)
-- ---------------------------------------------------------------------------

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  requester_name text not null default '',
  addressee_id uuid not null references auth.users (id) on delete cascade,
  addressee_name text not null default '',
  status text not null default 'accepted' check (status = 'accepted'),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  check (requester_id <> addressee_id)
);

create unique index friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);
create index friendships_addressee_idx on public.friendships (addressee_id);

-- ---------------------------------------------------------------------------
-- tasks (Base44 Task)
-- ---------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  completed boolean not null default false,
  "order" double precision not null default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid not null default auth.uid() references auth.users (id) on delete cascade
);

create index tasks_owner_idx on public.tasks (created_by_id);

create trigger tasks_updated_date
  before update on public.tasks
  for each row execute function public.set_updated_date();

-- ---------------------------------------------------------------------------
-- Row level security (mirrors the Base44 `rls` blocks)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.calendars enable row level security;
alter table public.events enable row level security;
alter table public.event_invitations enable row level security;
alter table public.event_templates enable row level security;
alter table public.friendships enable row level security;
alter table public.tasks enable row level security;

create policy "profiles: own row" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "calendars: members read" on public.calendars
  for select to authenticated
  using ((select auth.uid()) = any (members) or owner_id = (select auth.uid()));
create policy "calendars: create own" on public.calendars
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "calendars: owner updates" on public.calendars
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "calendars: owner deletes" on public.calendars
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "events: visible read" on public.events
  for select to authenticated
  using ((select auth.uid()) = any (visible_to) or created_by_id = (select auth.uid()));
create policy "events: create own" on public.events
  for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "events: visible update" on public.events
  for update to authenticated
  using ((select auth.uid()) = any (visible_to) or created_by_id = (select auth.uid()))
  with check ((select auth.uid()) = any (visible_to) or created_by_id = (select auth.uid()));
-- Narrower than Base44 (which let any viewer delete): the owner, or a member of
-- the event's shared calendar. Accepted invitees can no longer delete the event.
create policy "events: owner or calendar member deletes" on public.events
  for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.calendars c
      where c.id = calendar_id and (select auth.uid()) = any (c.members)
    )
  );

create policy "invitations: parties read" on public.event_invitations
  for select to authenticated
  using (inviter_id = (select auth.uid()) or invitee_id = (select auth.uid()));
create policy "invitations: parties delete" on public.event_invitations
  for delete to authenticated
  using (inviter_id = (select auth.uid()) or invitee_id = (select auth.uid()));

create policy "templates: own" on public.event_templates
  for all to authenticated
  using (created_by_id = (select auth.uid()))
  with check (created_by_id = (select auth.uid()));

create policy "friendships: parties read" on public.friendships
  for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));
create policy "friendships: parties delete" on public.friendships
  for delete to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy "tasks: own" on public.tasks
  for all to authenticated
  using (created_by_id = (select auth.uid()))
  with check (created_by_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants: anonymous visitors get nothing; signed-in users only the columns the
-- app edits. Everything else changes through triggers or the RPCs.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.calendars, public.events, public.event_invitations,
  public.event_templates, public.friendships, public.tasks from anon, authenticated;

grant select on public.profiles, public.calendars, public.events, public.event_invitations,
  public.event_templates, public.friendships, public.tasks to authenticated;

grant update (
  display_name, invite_code, theme, dark_mode, week_start, density, default_view,
  time_format, email_reminders, default_reminder_minutes, default_category, language
) on public.profiles to authenticated;

grant insert (name, description, color) on public.calendars to authenticated;
grant update (name, description, color) on public.calendars to authenticated;
grant delete on public.calendars to authenticated;

grant insert (
  title, description, start_at, end_at, all_day, category, priority, location, repeat,
  repeat_interval, repeat_end_date, reminder_minutes, email_reminder, email_recipients,
  done, calendar_id, external_uid
) on public.events to authenticated;
grant update (
  title, description, start_at, end_at, all_day, category, priority, location, repeat,
  repeat_interval, repeat_end_date, reminder_minutes, email_reminder, email_recipients,
  done, calendar_id
) on public.events to authenticated;
grant delete on public.events to authenticated;

grant delete on public.event_invitations to authenticated;

grant insert (name, title, description, location, category, priority, duration_minutes,
  all_day, reminder_minutes) on public.event_templates to authenticated;
grant update (name, title, description, location, category, priority, duration_minutes,
  all_day, reminder_minutes) on public.event_templates to authenticated;
grant delete on public.event_templates to authenticated;

grant delete on public.friendships to authenticated;

grant insert (title, description, priority, due_date, completed, "order")
  on public.tasks to authenticated;
grant update (title, description, priority, due_date, completed, "order")
  on public.tasks to authenticated;
grant delete on public.tasks to authenticated;

-- random_code stays callable: column defaults run with the caller's privileges.
revoke execute on function public.random_code(integer) from public, anon;
revoke execute on function public.fallback_name(text, jsonb), public.my_display_name(), public.handle_new_user(), public.calendars_before_insert(),
  public.events_before_write(), public.calendars_after_update()
  from public, anon, authenticated;
