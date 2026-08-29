-- Restore the owner-preview Data API projection. Object grants decide whether
-- PostgREST can reach these tables; the existing RLS policies still decide
-- which owner's rows are visible.
revoke all privileges on table public.media_assets, public.invitation_gallery_items
  from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.media_assets, public.invitation_gallery_items
  from authenticated;
grant select on table public.media_assets, public.invitation_gallery_items
  to authenticated;

-- Earlier editor code temporarily stored gallery media IDs as empty love-story
-- items. Move every READY purpose=gallery reference to the canonical ordered
-- relation while preserving any already canonical gallery rows.
with gallery_candidates as (
  select
    i.id as invitation_id,
    m.id as media_asset_id,
    entry.ordinality,
    coalesce((
      select max(existing.position)::integer
      from public.invitation_gallery_items existing
      where existing.invitation_id = i.id
    ), -1) as existing_max_position
  from public.invitations i
  cross join lateral jsonb_array_elements(i.love_story)
    with ordinality as entry(item, ordinality)
  join public.media_assets m
    on m.id = case
      when entry.item->>'photoMediaId'
        ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then (entry.item->>'photoMediaId')::uuid
      else null
    end
    and m.invitation_id = i.id
    and m.kind = 'image'
    and m.purpose = 'gallery'
    and m.status = 'ready'
), missing_gallery_candidates as (
  select
    candidate.*,
    row_number() over (
      partition by candidate.invitation_id
      order by candidate.ordinality, candidate.media_asset_id
    ) as missing_position
  from gallery_candidates candidate
  where not exists (
    select 1
    from public.invitation_gallery_items existing
    where existing.invitation_id = candidate.invitation_id
      and existing.media_asset_id = candidate.media_asset_id
  )
)
insert into public.invitation_gallery_items (
  invitation_id,
  media_asset_id,
  position
)
select
  candidate.invitation_id,
  candidate.media_asset_id,
  (candidate.existing_max_position + candidate.missing_position)::smallint
from missing_gallery_candidates candidate
on conflict (invitation_id, media_asset_id) do nothing;

with story_entries as (
  select
    invitation.id as invitation_id,
    entry.item,
    entry.ordinality,
    exists (
      select 1
      from public.media_assets media
      where media.invitation_id = invitation.id
        and media.kind = 'image'
        and media.purpose = 'gallery'
        and media.status = 'ready'
        and media.id = case
          when entry.item->>'photoMediaId'
            ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then (entry.item->>'photoMediaId')::uuid
          else null
        end
    ) as is_gallery_item
  from public.invitations invitation
  cross join lateral jsonb_array_elements(invitation.love_story)
    with ordinality as entry(item, ordinality)
), cleaned_stories as (
  select
    story.invitation_id,
    coalesce(
      jsonb_agg(story.item order by story.ordinality)
        filter (where not story.is_gallery_item),
      '[]'::jsonb
    ) as love_story
  from story_entries story
  group by story.invitation_id
  having bool_or(story.is_gallery_item)
)
update public.invitations invitation
set
  love_story = cleaned.love_story,
  content_version = invitation.content_version + 1,
  updated_at = now(),
  last_activity_at = now()
from cleaned_stories cleaned
where invitation.id = cleaned.invitation_id;

create or replace function public.replace_invitation_gallery(
  p_user_id uuid,
  p_invitation_id uuid,
  p_expected_version integer,
  p_media_asset_ids uuid[]
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_version integer;
  v_gallery_limit integer;
  v_input_count integer;
  v_valid_media_count integer;
  v_media_asset_ids uuid[] := coalesce(p_media_asset_ids, '{}'::uuid[]);
begin
  perform private.assert_invitation_editable(
    p_user_id,
    p_invitation_id,
    p_expected_version
  );

  v_input_count := cardinality(v_media_asset_ids);

  if (
    select count(distinct input.media_asset_id)
    from unnest(v_media_asset_ids) as input(media_asset_id)
  ) <> v_input_count then
    raise exception using errcode = 'P0001', message = 'INVALID_GALLERY_MEDIA';
  end if;

  select case
    when invitation.entitlement_tier_id is not null
      then (invitation.entitlement_snapshot->>'gallery_limit')::integer
    else tier.gallery_limit
  end
  into v_gallery_limit
  from public.invitations invitation
  join public.themes theme on theme.id = invitation.theme_id
  join public.tiers tier
    on tier.id = coalesce(invitation.entitlement_tier_id, theme.tier_id)
  where invitation.id = p_invitation_id
    and invitation.user_id = p_user_id;

  if v_gallery_limit is null or v_input_count > v_gallery_limit then
    raise exception using errcode = 'P0001', message = 'LIMIT_CONFLICT:gallery';
  end if;

  select count(*)
  into v_valid_media_count
  from public.media_assets media
  where media.id = any(v_media_asset_ids)
    and media.invitation_id = p_invitation_id
    and media.owner_id = p_user_id
    and media.kind = 'image'
    and media.purpose = 'gallery'
    and media.status = 'ready';

  if v_valid_media_count <> v_input_count then
    raise exception using errcode = 'P0001', message = 'INVALID_GALLERY_MEDIA';
  end if;

  delete from public.invitation_gallery_items
  where invitation_id = p_invitation_id;

  insert into public.invitation_gallery_items (
    invitation_id,
    media_asset_id,
    position
  )
  select
    p_invitation_id,
    requested.media_asset_id,
    (requested.ordinality - 1)::smallint
  from unnest(v_media_asset_ids)
    with ordinality as requested(media_asset_id, ordinality);

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

revoke all on function public.replace_invitation_gallery(uuid, uuid, integer, uuid[])
  from public, anon, authenticated;
grant execute on function public.replace_invitation_gallery(uuid, uuid, integer, uuid[])
  to service_role;
