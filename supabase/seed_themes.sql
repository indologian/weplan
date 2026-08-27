INSERT INTO themes (id, name, code, description, thumbnail_url, is_premium, is_active)
VALUES
  (gen_random_uuid(), 'Modern Elegance', 'MODERN_ELEGANCE', 'Tema modern dengan palet warna netral dan typografi serif elegan.', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80', false, true),
  (gen_random_uuid(), 'Classic Romance', 'CLASSIC_ROMANCE', 'Sentuhan klasik yang tak lekang oleh waktu dengan hiasan bunga dan warna pastel.', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&q=80', false, true),
  (gen_random_uuid(), 'Javanese Heritage', 'JAVANESE_HERITAGE', 'Tema tradisional Jawa dengan motif batik dan warna bumi khas Nusantara.', 'https://images.unsplash.com/photo-1544923405-b3eafc1122ce?w=500&q=80', true, true),
  (gen_random_uuid(), 'Luxury Midnight', 'LUXURY_MIDNIGHT', 'Tema premium eksklusif berlatar belakang gelap dengan aksen emas yang mewah.', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80', true, true)
ON CONFLICT (code) DO NOTHING;
