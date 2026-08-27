-- Fix Modern Editorial
UPDATE public.themes 
SET name = 'Modern Editorial', slug = 'modern-editorial' 
WHERE slug = 'modern-elegance' OR name = 'Modern Elegance';

-- Fix Romantic Floral
UPDATE public.themes 
SET name = 'Romantic Floral', slug = 'romantic-floral' 
WHERE slug = 'classic-romance' OR name = 'Classic Romance';

-- Fix Javanese Heritage Image (using a known good URL for traditional wedding/batik/java style)
UPDATE public.themes 
SET preview_image = 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&q=80' 
WHERE slug = 'javanese-heritage' OR name = 'Javanese Heritage';
