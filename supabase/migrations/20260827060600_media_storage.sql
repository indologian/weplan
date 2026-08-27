-- Storage buckets for media
-- These are created via Supabase Storage API in the application or via SQL.

-- Note: Supabase Storage buckets are managed via the storage schema.
-- The following creates the buckets and policies using Supabase functions.

-- Create quarantine bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invitation_upload_quarantine',
  'invitation_upload_quarantine',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create final media bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invitation_media',
  'invitation_media',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for quarantine bucket
-- Owner can upload to their own quarantine path
CREATE POLICY "Owner can upload to quarantine"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invitation_upload_quarantine'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Owner can read their own quarantine files
CREATE POLICY "Owner can read own quarantine"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'invitation_upload_quarantine'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Owner can delete their own quarantine files
CREATE POLICY "Owner can delete own quarantine"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'invitation_upload_quarantine'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can do everything with quarantine
CREATE POLICY "Service role full access quarantine"
ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'invitation_upload_quarantine');

-- Storage RLS policies for final media bucket
-- Owner can read their own final media
CREATE POLICY "Owner can read own final media"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'invitation_media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can do everything with final media
CREATE POLICY "Service role full access final media"
ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'invitation_media');
