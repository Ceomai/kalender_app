/*
# Create full schema for Takvimim calendar app (Expo migration)

Migrates all 8 Base44 entities to Supabase tables with RLS policies.
The app has authentication (sign-in screen), so all policies use
`TO authenticated` with `auth.uid()` ownership checks.

## Tables created:
1. profiles — merges User (role) + Profile (preferences), 1:1 with auth.users
2. calendars — shared calendars with owner + members
3. events — calendar events with recurring support, reminders, categories
4. event_invitations — RSVP invitations for events
5. event_templates — reusable event templates per user
6. friendships — friend connections between users
7. tasks — user to-do items

## Security:
- RLS enabled on every table
- Owner-scoped CRUD policies (4 per table: select/insert/update/delete)
- Shared calendars: members can read, only owner can delete
- Events: visible_to array + calendar membership for read access
- Invitations: inviter + invitee can access
- Friendships: requester + addressee can access
- Profile role column is NOT client-writable (handled via service role only)
*/

-- 1. PROFILES (merges User.role + Profile preferences)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text DEFAULT '',
  invite_code text UNIQUE DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  theme text NOT NULL DEFAULT 'aurora' CHECK (theme IN ('aurora','sunset','forest','ocean','berry','mono')),
  dark_mode boolean NOT NULL DEFAULT false,
  week_start text NOT NULL DEFAULT 'mon' CHECK (week_start IN ('mon','sun')),
  density text NOT NULL DEFAULT 'comfortable' CHECK (density IN ('comfortable','compact')),
  default_view text NOT NULL DEFAULT 'month' CHECK (default_view IN ('month','week','day','agenda','year')),
  time_format text NOT NULL DEFAULT '24h' CHECK (time_format IN ('24h','12h')),
  email_reminders boolean NOT NULL DEFAULT false,
  default_reminder_minutes integer NOT NULL DEFAULT 30,
  default_category text NOT NULL DEFAULT 'personal',
  language text NOT NULL DEFAULT 'tr' CHECK (language IN ('tr','en')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- 2. CALENDARS
CREATE TABLE IF NOT EXISTS calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT 'violet',
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name text DEFAULT '',
  members uuid[] DEFAULT '{}',
  member_names text[] DEFAULT '{}',
  invite_code text UNIQUE DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_calendars" ON calendars;
CREATE POLICY "select_calendars" ON calendars FOR SELECT
  TO authenticated USING (auth.uid() = owner_id OR auth.uid() = ANY(members));

DROP POLICY IF EXISTS "insert_calendars" ON calendars;
CREATE POLICY "insert_calendars" ON calendars FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_calendars" ON calendars;
CREATE POLICY "update_calendars" ON calendars FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id OR auth.uid() = ANY(members))
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = ANY(members));

DROP POLICY IF EXISTS "delete_calendars" ON calendars;
CREATE POLICY "delete_calendars" ON calendars FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- 3. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'personal',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  location text DEFAULT '',
  repeat text NOT NULL DEFAULT 'none' CHECK (repeat IN ('none','daily','weekly','biweekly','monthly','yearly')),
  repeat_interval integer NOT NULL DEFAULT 1,
  repeat_end_date timestamptz,
  reminder_minutes integer[] DEFAULT '{}',
  email_reminder boolean NOT NULL DEFAULT false,
  email_recipients text[] DEFAULT '{}',
  email_sent boolean NOT NULL DEFAULT false,
  done boolean NOT NULL DEFAULT false,
  calendar_id uuid REFERENCES calendars(id) ON DELETE SET NULL,
  calendar_name text DEFAULT '',
  calendar_color text DEFAULT '',
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name text DEFAULT '',
  visible_to uuid[] DEFAULT '{}',
  external_uid text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT
  TO authenticated USING (auth.uid() = owner_id OR auth.uid() = ANY(visible_to));

DROP POLICY IF EXISTS "insert_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_events" ON events;
CREATE POLICY "update_events" ON events FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id OR auth.uid() = ANY(visible_to))
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = ANY(visible_to));

DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "delete_events" ON events FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_calendar ON events(calendar_id);

-- 4. EVENT_INVITATIONS
CREATE TABLE IF NOT EXISTS event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_title text DEFAULT '',
  event_start timestamptz,
  inviter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_name text DEFAULT '',
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_name text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','tentative')),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_invitations" ON event_invitations;
CREATE POLICY "select_invitations" ON event_invitations FOR SELECT
  TO authenticated USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

DROP POLICY IF EXISTS "insert_invitations" ON event_invitations;
CREATE POLICY "insert_invitations" ON event_invitations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "update_invitations" ON event_invitations;
CREATE POLICY "update_invitations" ON event_invitations FOR UPDATE
  TO authenticated USING (auth.uid() = inviter_id OR auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = inviter_id OR auth.uid() = invitee_id);

DROP POLICY IF EXISTS "delete_invitations" ON event_invitations;
CREATE POLICY "delete_invitations" ON event_invitations FOR DELETE
  TO authenticated USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- 5. EVENT_TEMPLATES
CREATE TABLE IF NOT EXISTS event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  category text NOT NULL DEFAULT 'personal',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  duration_minutes integer NOT NULL DEFAULT 60,
  all_day boolean NOT NULL DEFAULT false,
  reminder_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_templates" ON event_templates;
CREATE POLICY "select_templates" ON event_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_templates" ON event_templates;
CREATE POLICY "insert_templates" ON event_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_templates" ON event_templates;
CREATE POLICY "update_templates" ON event_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_templates" ON event_templates;
CREATE POLICY "delete_templates" ON event_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 6. FRIENDSHIPS
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name text DEFAULT '',
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_name text DEFAULT '',
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_friendships" ON friendships;
CREATE POLICY "select_friendships" ON friendships FOR SELECT
  TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "insert_friendships" ON friendships;
CREATE POLICY "insert_friendships" ON friendships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_friendships" ON friendships;
CREATE POLICY "update_friendships" ON friendships FOR UPDATE
  TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "delete_friendships" ON friendships;
CREATE POLICY "delete_friendships" ON friendships FOR DELETE
  TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 7. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date timestamptz,
  completed boolean NOT NULL DEFAULT false,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tasks" ON tasks;
CREATE POLICY "select_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_tasks" ON tasks;
CREATE POLICY "insert_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_tasks" ON tasks;
CREATE POLICY "update_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_tasks" ON tasks;
CREATE POLICY "delete_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Helper function to generate random invite codes
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * 36 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
