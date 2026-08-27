-- WP-REM-04: Storage Domain Constraints
-- Prevent Image Processing DoS by bounding metadata inputs.

ALTER TABLE public.media_assets
  ADD CONSTRAINT chk_media_assets_width CHECK (width IS NULL OR width <= 4096),
  ADD CONSTRAINT chk_media_assets_height CHECK (height IS NULL OR height <= 4096),
  ADD CONSTRAINT chk_media_assets_byte_size CHECK (byte_size IS NULL OR byte_size <= 52428800); -- 50MB absolute max

-- Protect against oversized duration claims
ALTER TABLE public.media_assets
  ADD CONSTRAINT chk_media_assets_duration CHECK (duration_seconds IS NULL OR duration_seconds <= 36000); -- 10 hours absolute max
