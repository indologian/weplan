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
  (gen_random_uuid(), (SELECT id FROM t_basic), 'modern-editorial-ivory', 'Modern Editorial', 'modern-editorial', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80', 'modern', true),
  (gen_random_uuid(), (SELECT id FROM t_basic), 'romantic-floral-watercolor', 'Romantic Floral', 'romantic-floral', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&q=80', 'floral', true),
  (gen_random_uuid(), (SELECT id FROM t_prem), 'javanese-heritage', 'Javanese Heritage', 'javanese-heritage', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&q=80', 'traditional', true),
  (gen_random_uuid(), (SELECT id FROM t_prem), 'luxury-midnight', 'Luxury Midnight', 'luxury-midnight', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80', 'royal', true)
ON CONFLICT (slug) DO NOTHING;
