begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(20);

select has_table('public', 'user_profiles', 'user_profiles exists');
select has_table('public', 'invitations', 'invitations exists');
select has_table('public', 'invitation_pin_credentials', 'PIN credentials are separated');
select has_table('public', 'security_audit_logs', 'security audit foundation exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.invitations'::regclass),
  true,
  'RLS is enabled on invitations'
);

select ok(
  not has_table_privilege('authenticated', 'public.invitation_pin_credentials', 'select'),
  'authenticated role cannot select PIN credentials'
);
select ok(
  not has_table_privilege('authenticated', 'public.security_audit_logs', 'select'),
  'authenticated role cannot read raw security audit rows'
);
select ok(
  not has_table_privilege('authenticated', 'public.invitations', 'insert'),
  'browser role cannot insert invitations directly'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.create_or_sync_invitation(uuid,uuid,uuid,jsonb,jsonb)',
    'execute'
  ),
  'service role can execute canonical creation RPC'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_or_sync_invitation(uuid,uuid,uuid,jsonb,jsonb)',
    'execute'
  ),
  'authenticated browser role cannot execute canonical creation RPC'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a@example.test', '', now(), '{}', '{"role":"super_admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'b@example.test', '', now(), '{}', '{}', now(), now());

insert into public.user_profiles (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'a@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'b@example.test');

select lives_ok(
  $$insert into public.user_profiles (id, email, full_name, avatar_url, updated_at)
    values ('10000000-0000-0000-0000-000000000001', 'a@example.test', 'Updated A', null, now())
    on conflict (id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      avatar_url = excluded.avatar_url,
      updated_at = excluded.updated_at$$,
  'trusted profile provisioning is idempotent'
);
select is(
  (select role from public.user_profiles where id = '10000000-0000-0000-0000-000000000001'),
  'user',
  'user metadata role is not trusted during provisioning'
);

insert into public.tiers (
  id, code, tier_rank, name, price_amount, duration_months,
  gallery_limit, video_limit, bank_account_limit
) values (
  '30000000-0000-0000-0000-000000000003', 'basic', 10, 'Fixture Basic', 1, 1, 0, 0, 0
) on conflict (code) do update set name = EXCLUDED.name;

insert into public.themes (id, tier_id, renderer_key, name, slug) values (
  '40000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000003',
  'fixture', 'Fixture Theme', 'fixture-theme'
);

set local role service_role;
select lives_ok(
  $$select * from public.create_or_sync_invitation(
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000004',
    '{"groom":{"name":"A"}}',
    '{"title":"Akad"}'
  )$$,
  'canonical creation succeeds'
);
select lives_ok(
  $$select * from public.create_or_sync_invitation(
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000004',
    '{"groom":{"name":"A"}}',
    '{"title":"Akad"}'
  )$$,
  'retry with the same client_ref succeeds'
);
reset role;

select is(
  (select count(*) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  1::bigint,
  'retry creates exactly one invitation'
);
select is(
  (select count(*) from public.invitation_events e join public.invitations i on i.id = e.invitation_id where i.client_ref = '50000000-0000-0000-0000-000000000005'),
  1::bigint,
  'initial event is created atomically once'
);
select matches(
  (select slug from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  '^w-[0-9a-f]{12}$',
  'slug is opaque and server-generated'
);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select is((select count(*) from public.invitations), 1::bigint, 'owner A sees own invitation');
set local request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';
select is((select count(*) from public.invitations), 0::bigint, 'owner B cannot see owner A invitation');
select throws_ok(
  $$select * from public.invitation_pin_credentials$$,
  '42501',
  null,
  'owner cannot read credential hashes'
);
reset role;

select * from finish();
rollback;

