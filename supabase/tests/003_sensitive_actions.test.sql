begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(32);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'b@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_profiles (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'a@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'b@example.test');

insert into public.themes (id, tier_id, renderer_key, name, slug)
select
  fixture.id,
  tier.id,
  fixture.renderer_key,
  fixture.name,
  fixture.slug
from (
  values
    ('40000000-0000-0000-0000-000000000004'::uuid, 'premium', 'fixture-premium', 'Fixture Premium A', 'fixture-premium-a'),
    ('40000000-0000-0000-0000-000000000005'::uuid, 'premium', 'fixture-premium-2', 'Fixture Premium B', 'fixture-premium-b'),
    ('40000000-0000-0000-0000-000000000006'::uuid, 'basic', 'fixture-basic', 'Fixture Basic', 'fixture-basic')
) as fixture(id, tier_code, renderer_key, name, slug)
join public.tiers as tier on tier.code = fixture.tier_code;

set local role service_role;
select * from public.create_or_sync_invitation(
  '10000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000004',
  '{"groom":{"name":"A"},"bride":{"name":"B"}}',
  null
);
reset role;

select ok(
  has_function_privilege(
    'service_role',
    'public.update_invitation_privacy(uuid,uuid,integer,boolean,text)',
    'EXECUTE'
  ),
  'service_role can execute privacy RPC'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.update_invitation_privacy(uuid,uuid,integer,boolean,text)',
    'EXECUTE'
  ),
  'authenticated browser role cannot execute privacy RPC'
);

set local role service_role;
select is(
  (select public.update_invitation_theme(
    '10000000-0000-0000-0000-000000000001', id, 1,
    '40000000-0000-0000-0000-000000000005', array['fixture-premium-2']
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  2,
  'known active renderer theme can be selected'
);

select throws_ok(
  $$select public.update_invitation_theme(
    '10000000-0000-0000-0000-000000000001', id, 2,
    '40000000-0000-0000-0000-000000000004', array[]::text[]
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'THEME_NOT_AVAILABLE', 'unknown renderer fails closed'
);

select throws_ok(
  $$select public.update_invitation_theme(
    '20000000-0000-0000-0000-000000000002', id, 2,
    '40000000-0000-0000-0000-000000000004', array['fixture-premium']
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'NOT_FOUND', 'cross-owner theme mutation fails without version disclosure'
);

select throws_ok(
  $$select public.update_invitation_theme(
    '10000000-0000-0000-0000-000000000001', id, 1,
    '40000000-0000-0000-0000-000000000004', array['fixture-premium']
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'VERSION_CONFLICT:2', 'stale theme mutation returns current server version'
);

reset role;
update public.invitations
set bank_accounts = '[
  {"id":"70000000-0000-0000-0000-000000000001","bankName":"A","accountNumber":"1","accountHolder":"A"},
  {"id":"70000000-0000-0000-0000-000000000002","bankName":"B","accountNumber":"2","accountHolder":"B"}
]'::jsonb
where client_ref = '50000000-0000-0000-0000-000000000005';
set local role service_role;
select throws_ok(
  $$select public.update_invitation_theme(
    '10000000-0000-0000-0000-000000000001', id, 2,
    '40000000-0000-0000-0000-000000000006', array['fixture-basic']
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'THEME_LIMIT_CONFLICT', 'theme switch cannot hide content above target allowance'
);
reset role;
update public.invitations
set entitlement_tier_id = (select id from public.tiers where code = 'premium'),
    entitlement_snapshot = '{
      "schema_version":1,
      "tier_code":"premium",
      "duration_months":1,
      "gallery_limit":0,
      "video_limit":1,
      "bank_account_limit":2,
      "audio_enabled":true,
      "audio_size_limit_mb":5,
      "watermark_enabled":false
    }'::jsonb,
    expires_at = now() + interval '1 month'
where client_ref = '50000000-0000-0000-0000-000000000005';
set local role service_role;
select is(
  (select public.update_invitation_theme(
    '10000000-0000-0000-0000-000000000001', id, 2,
    '40000000-0000-0000-0000-000000000006', array['fixture-basic']
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  3,
  'paid theme switch uses purchased snapshot allowance instead of target catalog limits'
);
reset role;
update public.invitations
set theme_id = '40000000-0000-0000-0000-000000000005',
    entitlement_tier_id = null,
    entitlement_snapshot = null,
    expires_at = null,
    bank_accounts = '[]'::jsonb,
    content_version = 2
where client_ref = '50000000-0000-0000-0000-000000000005';
set local role service_role;

select throws_ok(
  $$select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 2, true, null
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'PIN_REQUIRED', 'private mode requires a credential'
);

select throws_ok(
  $$select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 2, true, '$argon2id$weak'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'INVALID_PIN_HASH', 'database rejects malformed or downgraded Argon2id PHC input'
);

select is(
  (select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 2, true, '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  3,
  'new PIN and private mode commit atomically'
);
select is(
  (select pin_version from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  2,
  'new PIN increments pin_version'
);
select is(
  (select pin_hash from public.invitation_pin_credentials c
    join public.invitations i on i.id = c.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'),
  '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'current PIN hash is stored outside invitations'
);
select is(
  (select count(*) from public.pin_history h
    join public.invitations i on i.id = h.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'),
  0::bigint,
  'a first PIN does not incorrectly enter history'
);

select is(
  (select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 3, false, null
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  4,
  'private to public increments content_version'
);
select is(
  (select count(*) from public.invitation_pin_credentials c
    join public.invitations i on i.id = c.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'),
  1::bigint,
  'public mode retains the current credential'
);
select is(
  (select pin_version from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  2,
  'privacy toggle alone does not increment pin_version'
);

select is(
  (select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 4, true, null
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  5,
  'public to private can reuse the retained credential'
);
select is(
  (select pin_version from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  2,
  'credential reuse does not revoke private sessions'
);

select is(
  (select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 5, true, '$argon2id$v=19$m=19456,t=2,p=1$BBBBBBBBBBBBBBBBBBBBBB$BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  5,
  'PIN rotation without a privacy change preserves content_version'
);
select is(
  (select count(*) from public.pin_history h
    join public.invitations i on i.id = h.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'
      and h.pin_hash = '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
  1::bigint,
  'replaced current PIN enters history'
);
select is(
  (select pin_hash from public.invitation_pin_credentials c
    join public.invitations i on i.id = c.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'),
  '$argon2id$v=19$m=19456,t=2,p=1$BBBBBBBBBBBBBBBBBBBBBB$BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'rotated PIN becomes current'
);
select is(
  (select pin_version from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  3,
  'PIN rotation increments pin_version exactly once'
);

select is(
  (select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 5, true, '$argon2id$v=19$m=19456,t=2,p=1$CCCCCCCCCCCCCCCCCCCCCC$CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  5,
  'third PIN is stored'
);
select is(
  (select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 5, true, '$argon2id$v=19$m=19456,t=2,p=1$DDDDDDDDDDDDDDDDDDDDDD$DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  5,
  'fourth PIN is stored'
);
select is(
  (select public.update_invitation_privacy(
    '10000000-0000-0000-0000-000000000001', id, 5, true, '$argon2id$v=19$m=19456,t=2,p=1$EEEEEEEEEEEEEEEEEEEEEE$EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  5,
  'fifth PIN is stored'
);
select is(
  (select count(*) from public.pin_history h
    join public.invitations i on i.id = h.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'),
  3::bigint,
  'only three historical PIN hashes are retained'
);
select is(
  (select count(*) from public.pin_history h
    join public.invitations i on i.id = h.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'
      and h.pin_hash = '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
  0::bigint,
  'oldest historical PIN hash is pruned'
);

select throws_ok(
  $$select public.update_invitation_privacy(
    '20000000-0000-0000-0000-000000000002', id, 5, false, null
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'NOT_FOUND', 'cross-owner privacy mutation fails'
);

select is(
  (select public.update_invitation_rsvp_config(
    '10000000-0000-0000-0000-000000000001', id, 5, 'open', 'manual'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  6,
  'RSVP configuration uses the same parent revision'
);
select throws_ok(
  $$select public.update_invitation_rsvp_config(
    '20000000-0000-0000-0000-000000000002', id, 6, 'open', 'manual'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'NOT_FOUND', 'cross-owner RSVP mutation fails'
);

reset role;
update public.user_profiles
set account_status = 'pending_deletion',
    deletion_requested_at = now(),
    deletion_execute_after = now() + interval '7 days'
where id = '10000000-0000-0000-0000-000000000001';
set local role service_role;
select throws_ok(
  $$select public.update_invitation_rsvp_config(
    '10000000-0000-0000-0000-000000000001', id, 6, 'personal_only', 'auto'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'INVALID_STATE', 'lifecycle guard applies to dedicated actions'
);

reset role;
select * from finish();
rollback;
