ALTER TABLE public.themes ADD COLUMN editable_overrides text[] NOT NULL DEFAULT '{}'::text[];
