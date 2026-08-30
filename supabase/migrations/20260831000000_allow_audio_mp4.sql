-- WP-MEDIA-M4A-01: izinkan M4A/AAC (audio/mp4) pada bucket media.
-- Idempoten, bebas duplikat, forward-only.
update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct m)
  from unnest(allowed_mime_types || array['audio/mp4', 'audio/x-m4a']) as m
)
where id in ('invitation_upload_quarantine', 'invitation_media')
  and allowed_mime_types is not null;