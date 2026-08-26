-- WP-M2 dedicated editor actions. M3 must populate the application renderer
-- registry before a theme can be activated; unknown renderers fail closed.

create or replace function public.update_invitation_theme(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_theme_id uuid,
  p_known_renderer_keys text[]
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
  v_renderer_key text;
  v_target_tier_rank smallint;
  v_target_bank_limit integer;
  v_target_video_limit integer;
  v_target_audio_enabled boolean;
  v_entitlement_tier_rank smallint;
  v_entitlement_snapshot jsonb;
  v_effective_bank_limit integer;
  v_effective_video_limit integer;
  v_effective_audio_enabled boolean;
  v_bank_usage integer;
  v_video_usage integer;
  v_audio_in_use boolean;
begin
  perform private.assert_invitation_editable(p_user_id, p_invitation_id, p_expected_version);

  select
    th.renderer_key,
    t.tier_rank,
    t.bank_account_limit,
    t.video_limit,
    t.audio_enabled
  into
    v_renderer_key,
    v_target_tier_rank,
    v_target_bank_limit,
    v_target_video_limit,
    v_target_audio_enabled
  from public.themes th
  join public.tiers t on t.id = th.tier_id
  where th.id = p_theme_id
    and th.is_active = true
    and t.is_active = true;

  if not found or not (v_renderer_key = any(coalesce(p_known_renderer_keys, '{}'::text[]))) then
    raise exception using errcode = 'P0001', message = 'THEME_NOT_AVAILABLE';
  end if;

  select
    entitlement_tier.tier_rank,
    i.entitlement_snapshot,
    jsonb_array_length(i.bank_accounts),
    case
      when jsonb_typeof(i.settings->'videoEmbeds') = 'array'
        then jsonb_array_length(i.settings->'videoEmbeds')
      else 0
    end,
    i.settings ? 'backgroundAudioMediaId'
      and i.settings->'backgroundAudioMediaId' <> 'null'::jsonb
  into
    v_entitlement_tier_rank,
    v_entitlement_snapshot,
    v_bank_usage,
    v_video_usage,
    v_audio_in_use
  from public.invitations i
  left join public.tiers entitlement_tier on entitlement_tier.id = i.entitlement_tier_id
  where i.id = p_invitation_id;

  if v_entitlement_tier_rank is not null and v_target_tier_rank > v_entitlement_tier_rank then
    raise exception using errcode = 'P0001', message = 'THEME_ENTITLEMENT_CONFLICT';
  end if;

  if v_entitlement_tier_rank is null then
    v_effective_bank_limit := v_target_bank_limit;
    v_effective_video_limit := v_target_video_limit;
    v_effective_audio_enabled := v_target_audio_enabled;
  else
    v_effective_bank_limit := (v_entitlement_snapshot->>'bank_account_limit')::integer;
    v_effective_video_limit := (v_entitlement_snapshot->>'video_limit')::integer;
    v_effective_audio_enabled := (v_entitlement_snapshot->>'audio_enabled')::boolean;
  end if;

  if v_bank_usage > v_effective_bank_limit
    or v_video_usage > v_effective_video_limit
    or (v_audio_in_use and not v_effective_audio_enabled)
  then
    raise exception using errcode = 'P0001', message = 'THEME_LIMIT_CONFLICT';
  end if;

  update public.invitations
  set
    theme_id = p_theme_id,
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

create or replace function public.update_invitation_privacy(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_is_private boolean,
  p_pin_hash text default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
  v_current_hash text;
  v_current_is_private boolean;
begin
  perform private.assert_invitation_editable(p_user_id, p_invitation_id, p_expected_version);

  if p_pin_hash is not null
    and p_pin_hash !~ '^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$'
  then
    raise exception using errcode = 'P0001', message = 'INVALID_PIN_HASH';
  end if;

  select pin_hash into v_current_hash
  from public.invitation_pin_credentials
  where invitation_id = p_invitation_id
  for update;

  select is_private into strict v_current_is_private
  from public.invitations
  where id = p_invitation_id and user_id = p_user_id;

  if p_is_private and p_pin_hash is null and v_current_hash is null then
    raise exception using errcode = 'P0001', message = 'PIN_REQUIRED';
  end if;

  if p_pin_hash is not null then
    if v_current_hash is not null then
      insert into public.pin_history (invitation_id, pin_hash, replaced_at)
      values (p_invitation_id, v_current_hash, clock_timestamp());
    end if;

    insert into public.invitation_pin_credentials (invitation_id, pin_hash, updated_at)
    values (p_invitation_id, p_pin_hash, now())
    on conflict (invitation_id) do update
    set pin_hash = excluded.pin_hash,
        updated_at = excluded.updated_at;

    delete from public.pin_history history
    where history.invitation_id = p_invitation_id
      and history.id in (
        select old_history.id
        from public.pin_history old_history
        where old_history.invitation_id = p_invitation_id
        order by old_history.replaced_at desc, old_history.id desc
        offset 3
      );
  end if;

  update public.invitations
  set
    is_private = p_is_private,
    pin_version = pin_version + case when p_pin_hash is null then 0 else 1 end,
    content_version = content_version
      + case when v_current_is_private is distinct from p_is_private then 1 else 0 end,
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

create or replace function public.update_invitation_rsvp_config(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_rsvp_mode text,
  p_guestbook_moderation text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
begin
  perform private.assert_invitation_editable(p_user_id, p_invitation_id, p_expected_version);

  if p_rsvp_mode not in ('personal_only', 'open')
    or p_guestbook_moderation not in ('auto', 'manual')
  then
    raise exception using errcode = 'P0001', message = 'INVALID_RSVP_CONFIG';
  end if;

  update public.invitations
  set
    rsvp_mode = p_rsvp_mode,
    guestbook_moderation = p_guestbook_moderation,
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

revoke all on function public.update_invitation_theme(uuid, uuid, integer, uuid, text[])
  from public, anon, authenticated;
revoke all on function public.update_invitation_privacy(uuid, uuid, integer, boolean, text)
  from public, anon, authenticated;
revoke all on function public.update_invitation_rsvp_config(uuid, uuid, integer, text, text)
  from public, anon, authenticated;

grant execute on function public.update_invitation_theme(uuid, uuid, integer, uuid, text[])
  to service_role;
grant execute on function public.update_invitation_privacy(uuid, uuid, integer, boolean, text)
  to service_role;
grant execute on function public.update_invitation_rsvp_config(uuid, uuid, integer, text, text)
  to service_role;
