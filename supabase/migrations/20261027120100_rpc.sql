-- RPCs replacing the web server functions that used Base44's `asServiceRole`.
-- Each one checks the caller itself and returns the same `{ ok, reason, ... }`
-- shape the web functions returned, so screens can be ported unchanged.

-- profileFns.getMySpace / ensureProfile: the caller's profile, created if missing.
create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  p public.profiles;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  select * into p from public.profiles where user_id = me;
  if found then
    return p;
  end if;
  insert into public.profiles (user_id, display_name, created_by_id)
  select me, public.fallback_name(u.email, u.raw_user_meta_data), me
  from auth.users u where u.id = me
  on conflict (user_id) do nothing;
  select * into p from public.profiles where user_id = me;
  return p;
end;
$$;

-- profileFns.rotateInviteCode
create or replace function public.rotate_invite_code()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  p public.profiles;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  perform public.ensure_profile();
  for attempt in 1 .. 5 loop
    begin
      update public.profiles set invite_code = public.random_code(6)
      where user_id = me
      returning * into p;
      return p;
    exception when unique_violation then
      -- try another code
    end;
  end loop;
  raise exception 'invite_code_exhausted';
end;
$$;

-- calendarFns.joinCalendarByCode
create or replace function public.join_calendar_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  code text := upper(trim(coalesce(p_code, '')));
  cal public.calendars;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if char_length(code) not between 4 and 12 then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into cal from public.calendars where invite_code = code for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if me = any (cal.members) then
    return jsonb_build_object('ok', false, 'reason', 'already');
  end if;

  update public.calendars
  set members = members || me, member_names = member_names || public.my_display_name()
  where id = cal.id
  returning * into cal;

  -- The new member sees the calendar's existing entries.
  update public.events
  set visible_to = visible_to || me
  where calendar_id = cal.id and not (me = any (visible_to));

  return jsonb_build_object('ok', true, 'calendar', to_jsonb(cal));
end;
$$;

-- calendarFns.leaveCalendar: the owner hands the calendar to the next member, or
-- deletes it (with its entries) when nobody is left.
create or replace function public.leave_calendar(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  cal public.calendars;
  rest_ids uuid[];
  rest_names text[];
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into cal from public.calendars where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if not (me = any (cal.members)) then
    return jsonb_build_object('ok', false, 'reason', 'not_member');
  end if;

  select coalesce(array_agg(t.m order by t.i), '{}'), coalesce(array_agg(t.n order by t.i), '{}')
  into rest_ids, rest_names
  from unnest(cal.members, cal.member_names) with ordinality as t (m, n, i)
  where t.m is distinct from me and t.m is not null;

  if cal.owner_id = me and cardinality(rest_ids) = 0 then
    delete from public.calendars where id = cal.id; -- entries go with it (on delete cascade)
    return jsonb_build_object('ok', true, 'removed', true);
  end if;

  update public.calendars
  set members = rest_ids,
      member_names = rest_names,
      owner_id = case when cal.owner_id = me then rest_ids[1] else owner_id end,
      owner_name = case when cal.owner_id = me then coalesce(rest_names[1], 'Kurucu') else owner_name end
  where id = cal.id;

  -- Stop showing the others' entries of this calendar to the one who left.
  update public.events
  set visible_to = array_remove(visible_to, me)
  where calendar_id = cal.id and owner_id <> me;

  return jsonb_build_object('ok', true, 'removed', false);
end;
$$;

-- friendFns.addFriendByCode
create or replace function public.add_friend_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  code text := upper(trim(coalesce(p_code, '')));
  target public.profiles;
  target_name text;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if char_length(code) not between 4 and 12 then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into target from public.profiles where invite_code = code;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if target.user_id = me then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;
  if exists (
    select 1 from public.friendships f
    where (f.requester_id = me and f.addressee_id = target.user_id)
       or (f.addressee_id = me and f.requester_id = target.user_id)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'exists');
  end if;

  target_name := coalesce(nullif(target.display_name, ''), 'Arkadaş');
  insert into public.friendships (requester_id, requester_name, addressee_id, addressee_name, status, created_by_id)
  values (me, public.my_display_name(), target.user_id, target_name, 'accepted', me);

  return jsonb_build_object('ok', true, 'friend', jsonb_build_object('id', target.user_id, 'name', target_name));
end;
$$;

-- invitationFns.inviteToEvent: invite friends (only real friends) to an event the caller sees.
create or replace function public.invite_to_event(p_event_id uuid, p_friend_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  ev public.events;
  valid uuid[];
  created integer;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_friend_ids is null or cardinality(p_friend_ids) not between 1 and 50 then
    raise exception 'invalid_friend_ids' using errcode = '22023';
  end if;

  select * into ev from public.events
  where id = p_event_id and (me = any (visible_to) or created_by_id = me);
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_event');
  end if;

  select coalesce(array_agg(distinct fid), '{}') into valid
  from unnest(p_friend_ids) as fid
  where exists (
    select 1 from public.friendships f
    where (f.requester_id = me and f.addressee_id = fid)
       or (f.addressee_id = me and f.requester_id = fid)
  );
  if cardinality(valid) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_friends');
  end if;

  insert into public.event_invitations (
    event_id, event_title, event_start, inviter_id, inviter_name, invitee_id, invitee_name, status, created_by_id
  )
  select ev.id, ev.title, ev.start_at, me, public.my_display_name(), fid,
    coalesce((
      select case when f.requester_id = me then f.addressee_name else f.requester_name end
      from public.friendships f
      where (f.requester_id = me and f.addressee_id = fid)
         or (f.addressee_id = me and f.requester_id = fid)
      limit 1
    ), 'Arkadaş'),
    'pending', me
  from unnest(valid) as fid
  on conflict (event_id, invitee_id) do nothing;
  get diagnostics created = row_count;

  return jsonb_build_object('ok', true, 'created', created, 'skipped', cardinality(valid) - created);
end;
$$;

-- invitationFns.respondToInvitation: accepting adds the invitee to the event's viewers.
create or replace function public.respond_to_invitation(p_invitation_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  inv public.event_invitations;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('accepted', 'declined', 'tentative') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  select * into inv from public.event_invitations where id = p_invitation_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if inv.invitee_id <> me then
    return jsonb_build_object('ok', false, 'reason', 'not_yours');
  end if;

  update public.event_invitations
  set status = p_status, responded_at = now()
  where id = inv.id;

  if p_status = 'accepted' then
    update public.events
    set visible_to = visible_to || me
    where id = inv.event_id and not (me = any (visible_to));
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- profileFns.wipeAccount, extended to delete the auth user itself: leave shared
-- calendars others own, then let the foreign keys cascade everything else.
create or replace function public.delete_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  cid uuid;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  for cid in
    select id from public.calendars where me = any (members) and owner_id <> me
  loop
    perform public.leave_calendar(cid);
  end loop;

  update public.events set visible_to = array_remove(visible_to, me)
  where me = any (visible_to) and owner_id <> me;

  delete from auth.users where id = me;
  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function
  public.ensure_profile(),
  public.rotate_invite_code(),
  public.join_calendar_by_code(text),
  public.leave_calendar(uuid),
  public.add_friend_by_code(text),
  public.invite_to_event(uuid, uuid[]),
  public.respond_to_invitation(uuid, text),
  public.delete_account()
from public, anon;

grant execute on function
  public.ensure_profile(),
  public.rotate_invite_code(),
  public.join_calendar_by_code(text),
  public.leave_calendar(uuid),
  public.add_friend_by_code(text),
  public.invite_to_event(uuid, uuid[]),
  public.respond_to_invitation(uuid, text),
  public.delete_account()
to authenticated;
