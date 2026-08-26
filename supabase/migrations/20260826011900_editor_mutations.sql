-- WP-M2 editor aggregate mutations. All RPCs are trusted-server-only and
-- execute with the service_role caller's privileges (SECURITY INVOKER).

create or replace function private.assert_invitation_editable(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row record;
begin
  select
    i.content_version,
    i.status,
    i.entitlement_tier_id,
    i.expires_at,
    p.account_status,
    p.is_blocked,
    p.deleted_at
  into v_row
  from public.invitations i
  join public.user_profiles p on p.id = i.user_id
  where i.id = p_invitation_id
    and i.user_id = p_user_id
  for update of i;

  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;

  if v_row.account_status <> 'active'
    or v_row.is_blocked
    or v_row.deleted_at is not null
    or v_row.status not in ('draft', 'published')
    or (
      v_row.entitlement_tier_id is not null
      and (v_row.expires_at is null or v_row.expires_at <= now())
    )
  then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;

  if v_row.content_version <> p_expected_version then
    raise exception using
      errcode = 'P0001',
      message = format('VERSION_CONFLICT:%s', v_row.content_version);
  end if;

  return v_row.content_version;
end;
$$;

revoke all on function private.assert_invitation_editable(uuid, uuid, integer)
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.assert_invitation_editable(uuid, uuid, integer)
  to service_role;

create or replace function public.save_invitation_content(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_couple jsonb default null,
  p_love_story jsonb default null,
  p_bank_accounts jsonb default null,
  p_settings jsonb default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
  v_bank_limit integer;
  v_video_limit integer;
  v_audio_enabled boolean;
begin
  perform private.assert_invitation_editable(p_user_id, p_invitation_id, p_expected_version);

  if (p_couple is not null and jsonb_typeof(p_couple) <> 'object')
    or (p_love_story is not null and jsonb_typeof(p_love_story) <> 'array')
    or (p_bank_accounts is not null and jsonb_typeof(p_bank_accounts) <> 'array')
    or (p_settings is not null and jsonb_typeof(p_settings) <> 'object')
  then
    raise exception using errcode = 'P0001', message = 'INVALID_CONTENT';
  end if;

  select
    case
      when i.entitlement_tier_id is not null
        then (i.entitlement_snapshot->>'bank_account_limit')::integer
      else t.bank_account_limit
    end,
    case
      when i.entitlement_tier_id is not null
        then (i.entitlement_snapshot->>'video_limit')::integer
      else t.video_limit
    end,
    case
      when i.entitlement_tier_id is not null
        then (i.entitlement_snapshot->>'audio_enabled')::boolean
      else t.audio_enabled
    end
  into v_bank_limit, v_video_limit, v_audio_enabled
  from public.invitations i
  join public.themes th on th.id = i.theme_id
  join public.tiers t on t.id = coalesce(i.entitlement_tier_id, th.tier_id)
  where i.id = p_invitation_id;

  if p_bank_accounts is not null and jsonb_array_length(p_bank_accounts) > v_bank_limit then
    raise exception using errcode = 'P0001', message = 'LIMIT_CONFLICT:bankAccounts';
  end if;

  if p_settings is not null and p_settings ? 'videoEmbeds' then
    if jsonb_typeof(p_settings->'videoEmbeds') <> 'array'
      or jsonb_array_length(p_settings->'videoEmbeds') > v_video_limit
    then
      raise exception using errcode = 'P0001', message = 'LIMIT_CONFLICT:videoEmbeds';
    end if;
  end if;

  if p_settings is not null
    and p_settings ? 'backgroundAudioMediaId'
    and p_settings->'backgroundAudioMediaId' <> 'null'::jsonb
    and not v_audio_enabled
  then
    raise exception using errcode = 'P0001', message = 'LIMIT_CONFLICT:backgroundAudioMediaId';
  end if;

  update public.invitations
  set
    content_version = content_version + 1,
    couple = coalesce(p_couple, couple),
    love_story = coalesce(p_love_story, love_story),
    bank_accounts = coalesce(p_bank_accounts, bank_accounts),
    settings = coalesce(p_settings, settings),
    updated_at = now(),
    last_activity_at = now()
  where id = p_invitation_id
    and user_id = p_user_id
    and content_version = p_expected_version
  returning content_version into v_new_version;

  if v_new_version is null then
    raise exception using errcode = 'P0001', message = 'INTERNAL_CAS_FAILURE';
  end if;
  return v_new_version;
end;
$$;

create or replace function public.save_invitation_event(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_event_id uuid,
  p_position smallint,
  p_event_type text,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_timezone text,
  p_venue_name text,
  p_address text,
  p_latitude numeric,
  p_longitude numeric
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
  v_event_id uuid;
begin
  perform private.assert_invitation_editable(p_user_id, p_invitation_id, p_expected_version);

  if p_timezone is not null and not exists (
    select 1 from pg_catalog.pg_timezone_names where name = p_timezone
  ) then
    raise exception using errcode = 'P0001', message = 'INVALID_TIMEZONE';
  end if;

  if p_event_id is null then
    insert into public.invitation_events (
      invitation_id, position, event_type, title, starts_at, ends_at, timezone,
      venue_name, address, latitude, longitude
    ) values (
      p_invitation_id, p_position, p_event_type, p_title, p_starts_at, p_ends_at, p_timezone,
      p_venue_name, p_address, p_latitude, p_longitude
    ) returning id into v_event_id;
  else
    update public.invitation_events
    set
      position = p_position,
      event_type = p_event_type,
      title = p_title,
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      timezone = p_timezone,
      venue_name = p_venue_name,
      address = p_address,
      latitude = p_latitude,
      longitude = p_longitude,
      updated_at = now()
    where id = p_event_id
      and invitation_id = p_invitation_id
    returning id into v_event_id;

    if v_event_id is null then
      raise exception using errcode = 'P0001', message = 'EVENT_NOT_FOUND';
    end if;
  end if;

  update public.invitations
  set
    content_version = content_version + 1,
    updated_at = now(),
    last_activity_at = now()
  where id = p_invitation_id
    and user_id = p_user_id
    and content_version = p_expected_version
  returning content_version into v_new_version;

  if v_new_version is null then
    raise exception using errcode = 'P0001', message = 'INTERNAL_CAS_FAILURE';
  end if;

  return jsonb_build_object('content_version', v_new_version, 'event_id', v_event_id);
end;
$$;

create or replace function public.delete_invitation_event(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_event_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
  v_deleted_id uuid;
begin
  perform private.assert_invitation_editable(p_user_id, p_invitation_id, p_expected_version);

  delete from public.invitation_events
  where id = p_event_id
    and invitation_id = p_invitation_id
  returning id into v_deleted_id;

  if v_deleted_id is null then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_FOUND';
  end if;

  update public.invitations
  set
    content_version = content_version + 1,
    updated_at = now(),
    last_activity_at = now()
  where id = p_invitation_id
    and user_id = p_user_id
    and content_version = p_expected_version
  returning content_version into v_new_version;

  if v_new_version is null then
    raise exception using errcode = 'P0001', message = 'INTERNAL_CAS_FAILURE';
  end if;
  return v_new_version;
end;
$$;

create or replace function public.reorder_invitation_events(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_event_ids uuid[]
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
  v_event_count integer;
  v_input_count integer := coalesce(cardinality(p_event_ids), 0);
  v_temp_start integer;
begin
  perform private.assert_invitation_editable(p_user_id, p_invitation_id, p_expected_version);

  select count(*) into v_event_count
  from public.invitation_events
  where invitation_id = p_invitation_id;

  if v_input_count > 20
    or v_input_count <> v_event_count
    or (
      select count(distinct input.event_id)
      from unnest(coalesce(p_event_ids, '{}'::uuid[])) as input(event_id)
    ) <> v_input_count
    or exists (
      select 1
      from unnest(coalesce(p_event_ids, '{}'::uuid[])) as input(event_id)
      left join public.invitation_events e
        on e.id = input.event_id and e.invitation_id = p_invitation_id
      where e.id is null
    )
  then
    raise exception using errcode = 'P0001', message = 'INVALID_EVENT_ORDER';
  end if;

  if v_event_count > 0 then
    v_temp_start := 32768 - v_event_count;
    while v_temp_start >= v_event_count and exists (
      select 1
      from public.invitation_events
      where invitation_id = p_invitation_id
        and position between v_temp_start and v_temp_start + v_event_count - 1
    ) loop
      v_temp_start := v_temp_start - v_event_count;
    end loop;

    if v_temp_start < v_event_count then
      raise exception using errcode = 'P0001', message = 'INVALID_EVENT_ORDER';
    end if;

    with current_order as (
      select id, row_number() over (order by position, id) - 1 as offset
      from public.invitation_events
      where invitation_id = p_invitation_id
    )
    update public.invitation_events e
    set position = (v_temp_start + current_order.offset)::smallint,
        updated_at = now()
    from current_order
    where e.id = current_order.id;

    with requested_order as (
      select event_id, ordinal - 1 as position
      from unnest(p_event_ids) with ordinality as requested(event_id, ordinal)
    )
    update public.invitation_events e
    set position = requested_order.position::smallint,
        updated_at = now()
    from requested_order
    where e.id = requested_order.event_id
      and e.invitation_id = p_invitation_id;
  end if;

  update public.invitations
  set
    content_version = content_version + 1,
    updated_at = now(),
    last_activity_at = now()
  where id = p_invitation_id
    and user_id = p_user_id
    and content_version = p_expected_version
  returning content_version into v_new_version;

  if v_new_version is null then
    raise exception using errcode = 'P0001', message = 'INTERNAL_CAS_FAILURE';
  end if;
  return v_new_version;
end;
$$;

revoke all on function public.save_invitation_content(uuid, uuid, integer, jsonb, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.save_invitation_event(uuid, uuid, integer, uuid, smallint, text, text, timestamptz, timestamptz, text, text, text, numeric, numeric)
  from public, anon, authenticated;
revoke all on function public.delete_invitation_event(uuid, uuid, integer, uuid)
  from public, anon, authenticated;
revoke all on function public.reorder_invitation_events(uuid, uuid, integer, uuid[])
  from public, anon, authenticated;

grant execute on function public.save_invitation_content(uuid, uuid, integer, jsonb, jsonb, jsonb, jsonb)
  to service_role;
grant execute on function public.save_invitation_event(uuid, uuid, integer, uuid, smallint, text, text, timestamptz, timestamptz, text, text, text, numeric, numeric)
  to service_role;
grant execute on function public.delete_invitation_event(uuid, uuid, integer, uuid)
  to service_role;
grant execute on function public.reorder_invitation_events(uuid, uuid, integer, uuid[])
  to service_role;
