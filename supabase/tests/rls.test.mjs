// Runs the Supabase migrations against PGlite with a minimal stand-in for the
// `auth` schema, then exercises RLS / grants / RPCs as different users.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Usage: npm run test:db  (or node supabase/tests/rls.test.mjs <migrations dir>)
const migrationsDir = process.argv[2] ?? fileURLToPath(new URL('../migrations', import.meta.url));
const db = new PGlite({ extensions: { pgcrypto } });

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);

for (const f of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(migrationsDir, f), 'utf8'));
  console.log('applied', f);
}

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c';
await db.query(`insert into auth.users (id, email, raw_user_meta_data) values
  ($1, 'ayse@example.com', '{"full_name":"Ayşe"}'), ($2, 'bora@example.com', '{}'), ($3, 'cem@example.com', '{}')`, [A, B, C]);

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ok  ', name);
  else {
    failures++;
    console.log('  FAIL', name, extra ?? '');
  }
}

async function as(user, sql, params = []) {
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? '']);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role');
  }
}
async function fails(user, sql, params = []) {
  try {
    await as(user, sql, params);
    return null;
  } catch (e) {
    return e.message;
  }
}
const rpc = async (user, fn, args = '') => (await as(user, `select public.${fn}(${args}) as r`)).rows[0].r;

// profiles
const profs = await as(A, 'select * from public.profiles');
check('profile auto-created, only own visible', profs.rows.length === 1 && profs.rows[0].display_name === 'Ayşe');
check('fallback name from e-mail', (await as(B, 'select display_name from public.profiles')).rows[0].display_name === 'bora');
await as(A, `update public.profiles set display_name = 'Ayşe K', theme = 'ocean' where user_id = $1`, [A]);
check('update own prefs', (await as(A, 'select theme from public.profiles')).rows[0].theme === 'ocean');
check('cannot change user_id', !!(await fails(A, `update public.profiles set user_id = $1`, [B])));
check('bad invite code rejected', !!(await fails(A, `update public.profiles set invite_code = 'ab'`)));
check('ensure_profile returns own', (await as(B, 'select (public.ensure_profile()).user_id as u')).rows[0].u === B);
const rotated = await as(B, 'select (public.rotate_invite_code()).invite_code as c');
check('rotate invite code', /^[A-Z2-9]{6}$/.test(rotated.rows[0].c));

// anon
check('anon cannot read events', !!(await fails(null, 'select * from public.events')));
check('anon cannot call rpc', !!(await fails(null, `select public.join_calendar_by_code('XXXXXX')`)));

// calendars
const cal = (await as(A, `insert into public.calendars (name, color) values ('Aile', 'sky') returning *`)).rows[0];
check('calendar owner/members set by trigger', cal.owner_id === A && cal.members.length === 1 && cal.member_names[0] === 'Ayşe K');
check('cannot insert members directly', !!(await fails(A, `insert into public.calendars (name, members) values ('x', array[$1]::uuid[])`, [B])));
check('B cannot see calendar', (await as(B, 'select * from public.calendars')).rows.length === 0);

// events
const personal = (await as(A, `insert into public.events (title, start_at) values ('Doktor', '2026-11-01T09:00:00Z') returning *`)).rows[0];
check('personal event visible_to = [owner]', personal.visible_to.length === 1 && personal.owner_name === 'Ayşe K');
const shared = (await as(A, `insert into public.events (title, start_at, calendar_id, email_reminder, email_recipients)
  values ('Piknik', '2026-11-02T09:00:00Z', $1, true, array[$2]::uuid[]) returning *`, [cal.id, C])).rows[0];
check('calendar snapshot on event', shared.calendar_name === 'Aile' && shared.calendar_color === 'sky');
check('email recipients filtered to viewers', shared.email_recipients.length === 1 && shared.email_recipients[0] === A);
check('B sees no events', (await as(B, 'select * from public.events')).rows.length === 0);
check('B cannot post into A calendar', /calendar_forbidden/.test(await fails(B, `insert into public.events (title, start_at, calendar_id) values ('x', now(), $1)`, [cal.id]) ?? ''));
check('cannot set visible_to on insert', !!(await fails(B, `insert into public.events (title, start_at, visible_to) values ('x', now(), array[$1]::uuid[])`, [A])));

// join calendar
const joinRes = await rpc(B, 'join_calendar_by_code', `'${cal.invite_code.toLowerCase()}'`);
check('join by code (case-insensitive)', joinRes.ok === true);
check('join twice -> already', (await rpc(B, 'join_calendar_by_code', `'${cal.invite_code}'`)).reason === 'already');
check('wrong code -> not_found', (await rpc(B, 'join_calendar_by_code', `'ZZZZZZ'`)).reason === 'not_found');
const bEvents = (await as(B, 'select title from public.events order by title')).rows.map((r) => r.title);
check('B sees calendar event only', bEvents.join() === 'Piknik', bEvents);
check('B cannot update visible_to', !!(await fails(B, `update public.events set visible_to = '{}' where id = $1`, [shared.id])));
await as(B, `update public.events set title = 'Piknik!' where id = $1`, [shared.id]);
check('member edits shared event', (await as(A, 'select title from public.events where id = $1', [shared.id])).rows[0].title === 'Piknik!');
await as(B, `update public.events set title = 'hack' where id = $1`, [personal.id]);
check('B cannot touch personal event', (await as(A, 'select title from public.events where id = $1', [personal.id])).rows[0].title === 'Doktor');
await as(A, `update public.calendars set name = 'Ailem' where id = $1`, [cal.id]);
check('rename propagates to events', (await as(A, 'select calendar_name from public.events where id = $1', [shared.id])).rows[0].calendar_name === 'Ailem');
await as(B, `update public.calendars set name = 'B' where id = $1`, [cal.id]);
check('member cannot rename calendar', (await as(A, 'select name from public.calendars where id = $1', [cal.id])).rows[0].name === 'Ailem');

// friends
const bCode = (await as(B, 'select invite_code from public.profiles')).rows[0].invite_code;
const aCode = (await as(A, 'select invite_code from public.profiles')).rows[0].invite_code;
check('add friend', (await rpc(A, 'add_friend_by_code', `'${bCode}'`)).ok === true);
check('add friend again -> exists', (await rpc(B, 'add_friend_by_code', `'${aCode}'`)).reason === 'exists');
check('add self -> self', (await rpc(A, 'add_friend_by_code', `'${aCode}'`)).reason === 'self');
check('both see friendship', (await as(B, 'select * from public.friendships')).rows.length === 1);
check('C sees no friendship', (await as(C, 'select * from public.friendships')).rows.length === 0);
check('cannot insert friendship directly', !!(await fails(C, `insert into public.friendships (requester_id, addressee_id) values ($1, $2)`, [C, A])));

// invitations
const inv = await rpc(A, 'invite_to_event', `'${personal.id}', array['${B}','${C}']::uuid[]`);
check('invite only friends', inv.ok && inv.created === 1, inv);
check('C cannot invite to A event', (await rpc(C, 'invite_to_event', `'${personal.id}', array['${A}']::uuid[]`)).reason === 'no_event');
const invRow = (await as(B, 'select * from public.event_invitations')).rows[0];
check('invitee sees invitation', invRow?.inviter_name === 'Ayşe K' && invRow?.invitee_name === 'bora');
check('C cannot answer B invitation', (await rpc(C, 'respond_to_invitation', `'${invRow.id}', 'accepted'`)).reason === 'not_yours');
check('accept', (await rpc(B, 'respond_to_invitation', `'${invRow.id}', 'accepted'`)).ok === true);
check('accepted invitee sees event', (await as(B, 'select * from public.events where id = $1', [personal.id])).rows.length === 1);
await as(B, 'delete from public.events where id = $1', [personal.id]);
check('invitee cannot delete event', (await as(A, 'select * from public.events where id = $1', [personal.id])).rows.length === 1);

// changing the calendar keeps accepted invitees
await as(A, `update public.events set calendar_id = $1 where id = $2`, [cal.id, personal.id]);
const moved = (await as(A, 'select visible_to from public.events where id = $1', [personal.id])).rows[0];
check('calendar change recomputes visible_to', moved.visible_to.includes(B) && moved.visible_to.includes(A));
await as(A, `update public.events set calendar_id = null where id = $1`, [personal.id]);

// tasks / templates
await as(A, `insert into public.tasks (title, "order") values ('Süt al', 1)`);
check('task owner-only', (await as(B, 'select * from public.tasks')).rows.length === 0 && (await as(A, 'select * from public.tasks')).rows.length === 1);
check('cannot create task for others', !!(await fails(B, `insert into public.tasks (title, created_by_id) values ('x', $1)`, [A])));
await as(A, `insert into public.event_templates (name, title) values ('Spor', 'Koşu')`);
check('template owner-only', (await as(B, 'select * from public.event_templates')).rows.length === 0);

// leave calendar
check('B leaves', (await rpc(B, 'leave_calendar', `'${cal.id}'`)).removed === false);
check('B no longer sees calendar entries', (await as(B, 'select * from public.events where calendar_id = $1', [cal.id])).rows.length === 0);
check('owner leaving last deletes calendar', (await rpc(A, 'leave_calendar', `'${cal.id}'`)).removed === true);
check('calendar entries removed', (await db.query('select * from public.events where id = $1', [shared.id])).rows.length === 0);

// owner hand-over
const cal2 = (await as(A, `insert into public.calendars (name) values ('İş') returning *`)).rows[0];
await rpc(B, 'join_calendar_by_code', `'${cal2.invite_code}'`);
await rpc(A, 'leave_calendar', `'${cal2.id}'`);
const after = (await db.query('select owner_id, owner_name, members from public.calendars where id = $1', [cal2.id])).rows[0];
check('ownership handed to next member', after.owner_id === B && after.owner_name === 'bora' && after.members.length === 1);

// e-mail reminders
{
  const T0 = new Date('2026-11-10T09:00:00Z').getTime();
  const at = (min) => new Date(T0 + min * 60000).toISOString();
  const claim = async (min) => (await db.query('select * from public.claim_due_email_reminders($1)', [at(min)])).rows;
  const mkEvent = async (title, startMin, leads, extra = '') =>
    (
      await as(
        A,
        `insert into public.events (title, start_at, reminder_minutes, email_reminder${extra ? ', repeat' : ''})
         values ($1, $2, $3, true${extra ? `, '${extra}'` : ''}) returning id`,
        [title, at(startMin), leads],
      )
    ).rows[0].id;

  await as(A, `update public.profiles set email_reminders = true`);
  const e1 = await mkEvent('Mail 1', 60, [30]);
  check('not due before the lead', (await claim(0)).length === 0);
  const due = await claim(35);
  check('due after the lead, to the opted-in owner', due.length === 1 && due[0].email === 'ayse@example.com' && due[0].title === 'Mail 1' && due[0].language === 'tr', due);
  check('claimed once only', (await claim(36)).length === 0);
  await db.query('select public.release_email_reminder($1, $2)', [e1, at(60)]);
  check('released claim is sent again', (await claim(37)).length === 1);
  check('started occurrences are skipped', (await claim(61)).length === 0);

  // Weekly series that began a week ago: the next occurrence still gets its e-mail.
  await mkEvent('Haftalık', 120 - 7 * 24 * 60, [60], 'weekly');
  const weekly = await claim(65);
  check('later occurrence of a repeating entry', weekly.length === 1 && weekly[0].occurrence_start.toISOString() === at(120), weekly);

  // A one-week lead is honoured (Base44 looked only 48 h ahead).
  await mkEvent('Haftaya', 6 * 24 * 60, [10080]);
  check('one-week lead fires', (await claim(66)).some((r) => r.title === 'Haftaya'));

  // Recipients who turned e-mails off get nothing.
  await as(A, `update public.profiles set email_reminders = false`);
  await mkEvent('Kapalı', 200, [30]);
  check('opted-out recipient gets nothing', (await claim(175)).length === 0);

  check('users cannot claim reminders', !!(await fails(A, `select * from public.claim_due_email_reminders()`)));
  check('users cannot read the log', !!(await fails(A, `select * from public.email_reminder_log`)));
}

// delete account
check('delete account', (await rpc(B, 'delete_account')).ok === true);
check('auth user gone', (await db.query('select * from auth.users where id = $1', [B])).rows.length === 0);
check('B calendar cascaded', (await db.query('select * from public.calendars where id = $1', [cal2.id])).rows.length === 0);
check('friendship cascaded', (await db.query('select * from public.friendships')).rows.length === 0);

console.log(failures ? `\n${failures} failing check(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
