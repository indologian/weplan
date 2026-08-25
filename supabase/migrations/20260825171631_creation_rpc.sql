create or replace function public.create_or_sync_invitation(
  p_user_id uuid,
  p_client_ref uuid,
  p_theme_id uuid,
  p_couple jsonb default '{}'::jsonb,
  p_initial_event jsonb default null
)
returns table (invitation_id uuid, slug text, content_version integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_invitation public.invitations%rowtype;
  created_invitation public.invitations%rowtype;
  generated_slug text;
  slug_attempt integer := 0;
begin
  if p_user_id is null or p_client_ref is null or p_theme_id is null then
    raise exception 'required creation input is missing' using errcode = '22023';
  end if;

  if jsonb_typeof(p_couple) <> 'object' then
    raise exception 'couple must be an object' using errcode = '22023';
  end if;

  if p_initial_event is not null and jsonb_typeof(p_initial_event) <> 'object' then
    raise exception 'initial event must be an object' using errcode = '22023';
  end if;

  select i.* into existing_invitation
  from public.invitations i
  where i.client_ref = p_client_ref;

  if found then
    if existing_invitation.user_id <> p_user_id then
      raise exception 'client reference conflict' using errcode = '23505';
    end if;
    return query select existing_invitation.id, existing_invitation.slug, existing_invitation.content_version;
    return;
  end if;

  if not exists (
    select 1 from public.user_profiles p
    where p.id = p_user_id and p.account_status = 'active' and p.is_blocked = false
  ) then
    raise exception 'active profile not found' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.themes t where t.id = p_theme_id and t.is_active = true) then
    raise exception 'active theme not found' using errcode = 'P0002';
  end if;

  loop
    slug_attempt := slug_attempt + 1;
    generated_slug := 'w-' || encode(extensions.gen_random_bytes(6), 'hex');
    begin
      insert into public.invitations (user_id, theme_id, slug, client_ref, couple)
      values (p_user_id, p_theme_id, generated_slug, p_client_ref, p_couple)
      returning * into created_invitation;
      exit;
    exception when unique_violation then
      if exists (select 1 from public.invitations i where i.client_ref = p_client_ref) then
        select i.* into existing_invitation
        from public.invitations i where i.client_ref = p_client_ref;
        if existing_invitation.user_id <> p_user_id then
          raise exception 'client reference conflict' using errcode = '23505';
        end if;
        return query select existing_invitation.id, existing_invitation.slug, existing_invitation.content_version;
        return;
      end if;
      if slug_attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  if p_initial_event is not null then
    insert into public.invitation_events (
      invitation_id, position, event_type, title, starts_at, ends_at,
      timezone, venue_name, address, latitude, longitude
    ) values (
      created_invitation.id,
      coalesce((p_initial_event->>'position')::smallint, 0),
      coalesce(p_initial_event->>'eventType', 'other'),
      coalesce(p_initial_event->>'title', ''),
      nullif(p_initial_event->>'startsAt', '')::timestamptz,
      nullif(p_initial_event->>'endsAt', '')::timestamptz,
      nullif(p_initial_event->>'timezone', ''),
      coalesce(p_initial_event->>'venueName', ''),
      coalesce(p_initial_event->>'address', ''),
      nullif(p_initial_event->>'latitude', '')::numeric(9, 6),
      nullif(p_initial_event->>'longitude', '')::numeric(9, 6)
    );
  end if;

  return query select created_invitation.id, created_invitation.slug, created_invitation.content_version;
end;
$$;

revoke all on function public.create_or_sync_invitation(uuid, uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_or_sync_invitation(uuid, uuid, uuid, jsonb, jsonb)
  to service_role;
