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
as $body$
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
  left join public.themes th on th.id = i.theme_id
  left join public.tiers t on t.id = th.tier_id
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
    settings = case 
      when p_settings is not null then coalesce(nullif(settings, 'null'::jsonb), '{}'::jsonb) || p_settings
      else settings 
    end,
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
$body$;
