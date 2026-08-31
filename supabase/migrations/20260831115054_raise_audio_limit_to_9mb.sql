-- Raise the Premium audio allowance while keeping VIP's existing 10MB limit.
update public.tiers
set audio_size_limit_mb = 9,
    updated_at = now()
where code = 'premium'
  and audio_enabled = true
  and audio_size_limit_mb < 9;

-- Both buckets are shared with images, whose existing ceiling remains 10MB.
update storage.buckets
set file_size_limit = greatest(coalesce(file_size_limit, 10485760), 10485760)
where id in ('invitation_upload_quarantine', 'invitation_media');

-- Apply the improved allowance to active Premium entitlements already issued.
update public.invitations
set entitlement_snapshot = jsonb_set(
      entitlement_snapshot,
      '{audio_size_limit_mb}',
      to_jsonb(9),
      true
    ),
    updated_at = now()
where status in ('draft', 'published')
  and entitlement_snapshot->>'tier_code' = 'premium'
  and coalesce((entitlement_snapshot->>'audio_enabled')::boolean, false) = true
  and coalesce((entitlement_snapshot->>'audio_size_limit_mb')::integer, 0) < 9;
