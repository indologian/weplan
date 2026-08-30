begin;
select plan(5);

-- Setup
set local role postgres;

-- 1. Insert a tier, theme, user, and invitation
insert into public.tiers (id, code, tier_rank, name, price_amount, duration_months, gallery_limit, video_limit, bank_account_limit, audio_enabled)
values ('00000000-0000-0000-0000-000000000099', 'premium', 99, 'Premium Test', 1000, 12, 10, 5, 2, true)
on conflict (code) do update set tier_rank = 99, video_limit = 5, bank_account_limit = 2, audio_enabled = true;

insert into public.themes (id, tier_id, code, name, category, directory_path, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000099', 'test_theme', 'Test Theme', 'elegant', '/test', now(), now())
on conflict (code) do nothing;

insert into auth.users (id) values ('00000000-0000-0000-0000-000000000099')
on conflict (id) do nothing;

insert into public.user_profiles (id, email, display_name)
values ('00000000-0000-0000-0000-000000000099', 'test@test.com', 'Test User')
on conflict (id) do nothing;

insert into public.invitations (id, user_id, theme_id, slug, content_version, settings)
values ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000099', 'test-slug-99', 1, '{"openingText": "Hello", "videoEmbeds": []}'::jsonb)
on conflict (id) do nothing;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000099';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000099","role":"authenticated"}';

-- Test 1: Partial merge of settings
select is(
  public.save_invitation_content(
    '00000000-0000-0000-0000-000000000099'::uuid,
    '00000000-0000-0000-0000-000000000099'::uuid,
    1,
    null, null, null,
    '{"quoteText": "World"}'::jsonb
  ),
  2,
  'save_invitation_content should increment version on partial settings merge'
);

-- Test 2: Check the actual merged value
select is(
  (select settings from public.invitations where id = '00000000-0000-0000-0000-000000000099'::uuid),
  '{"openingText": "Hello", "videoEmbeds": [], "quoteText": "World"}'::jsonb,
  'settings should retain openingText and videoEmbeds while adding quoteText'
);

-- Test 3: Soft delete a field by passing null
select is(
  public.save_invitation_content(
    '00000000-0000-0000-0000-000000000099'::uuid,
    '00000000-0000-0000-0000-000000000099'::uuid,
    2,
    null, null, null,
    '{"openingText": null}'::jsonb
  ),
  3,
  'save_invitation_content should increment version when soft deleting'
);

-- Test 4: Check that openingText is now null
select is(
  (select settings from public.invitations where id = '00000000-0000-0000-0000-000000000099'::uuid),
  '{"openingText": null, "videoEmbeds": [], "quoteText": "World"}'::jsonb,
  'settings should have openingText set to null'
);

-- Test 5: Verify video limits are enforced from the tier (video limit is 5)
select throws_ok(
  $$ select public.save_invitation_content(
    '00000000-0000-0000-0000-000000000099'::uuid,
    '00000000-0000-0000-0000-000000000099'::uuid,
    3,
    null, null, null,
    '{"videoEmbeds": [1, 2, 3, 4, 5, 6]}'::jsonb
  ) $$,
  'P0001',
  'LIMIT_CONFLICT:videoEmbeds',
  'save_invitation_content should reject videoEmbeds exceeding limit'
);

select * from finish();
rollback;

