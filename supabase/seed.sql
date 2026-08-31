INSERT INTO public.tiers (id, code, tier_rank, name, price_amount, duration_months, gallery_limit, video_limit, bank_account_limit, audio_enabled, audio_size_limit_mb, watermark_enabled)
VALUES
  (gen_random_uuid(), 'basic', 10, 'Basic', 0, 12, 10, 0, 1, false, 0, true),
  (gen_random_uuid(), 'premium', 20, 'Premium', 149000, 12, 50, 1, 3, true, 9, false),
  (gen_random_uuid(), 'vip', 30, 'VIP', 299000, 12, 9999, 5, 5, true, 10, false)
ON CONFLICT (code) DO NOTHING;

WITH t_basic AS (SELECT id FROM public.tiers WHERE code = 'basic'),
     t_prem AS (SELECT id FROM public.tiers WHERE code = 'premium')
INSERT INTO public.themes (id, tier_id, renderer_key, name, slug, preview_image, category, is_active)
VALUES
  (gen_random_uuid(), (SELECT id FROM t_basic), 'modern-editorial-ivory', 'Modern Editorial', 'modern-editorial', '/theme-previews/modern-editorial.webp', 'modern', true),
  (gen_random_uuid(), (SELECT id FROM t_basic), 'romantic-floral-watercolor', 'Romantic Floral', 'romantic-floral', '/theme-previews/romantic-floral.webp', 'floral', true),
  (gen_random_uuid(), (SELECT id FROM t_prem), 'javanese-heritage', 'Javanese Heritage', 'javanese-heritage', '/theme-previews/javanese-heritage.webp', 'traditional', true),
  (gen_random_uuid(), (SELECT id FROM t_prem), 'luxury-midnight', 'Luxury Midnight', 'luxury-midnight', '/theme-previews/luxury-midnight.webp', 'royal', true)
ON CONFLICT (slug) DO NOTHING;
