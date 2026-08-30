begin;
select plan(5);

-- Setup
set local role postgres;

-- 1. Reuse the canonical premium tier and create isolated theme/user/invitation fixtures.
insert into public.themes (id, tier_id, renderer_key, slug, name, category)
select
  '00000000-0000-0000-0000-000000000099',
  id,
  'test_theme',
  'test-theme',
  'Test Theme',
  'modern'
from public.tiers
where code = 'premium'
on conflict (slug) do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000099',
  'authenticated',
  'authenticated',
  'test@test.com',
  '',
  now(),
  '{}',
  '{}',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.user_profiles (id, email, full_name)
values ('00000000-0000-0000-0000-000000000099', 'test@test.com', 'Test User')
on conflict (id) do nothing;

insert into public.invitations (id, user_id, theme_id, slug, content_version, settings)
values ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000099', 'test-slug-99', 1, '{"openingText": "Hello", "videoEmbeds": []}'::jsonb)
on conflict (id) do nothing;

set local role service_role;

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

-- Test 5: Verify video limits are enforced from the canonical premium tier.
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
