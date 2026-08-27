-- Fix renderer_key to match wedding-renderer.tsx cases
UPDATE public.themes SET renderer_key = 'modern-editorial-ivory' WHERE slug = 'modern-editorial';
UPDATE public.themes SET renderer_key = 'romantic-floral-watercolor' WHERE slug = 'romantic-floral';
UPDATE public.themes SET renderer_key = 'javanese-heritage' WHERE slug = 'javanese-heritage';
UPDATE public.themes SET renderer_key = 'luxury-midnight' WHERE slug = 'luxury-midnight';
