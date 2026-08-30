begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(19);

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

insert into public.tiers (
  id, code, tier_rank, name, price_amount, duration_months,
  gallery_limit, video_limit, bank_account_limit
) values (
  '30000000-0000-0000-0000-000000000003', 'basic', 10, 'Fixture Basic', 1, 1, 0, 1, 2
) on conflict (code) do update set name = EXCLUDED.name;

insert into public.themes (id, tier_id, renderer_key, name, slug) values (
  '40000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000003',
  'fixture', 'Fixture Theme', 'fixture-theme'
);

set local role service_role;
select * from public.create_or_sync_invitation(
  '10000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000004',
  '{"groom":{"name":"A"}}',
  null
);
reset role;

select ok(
  has_function_privilege(
    'service_role',
    'public.save_invitation_content(uuid,uuid,integer,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'service_role can execute editor autosave RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.save_invitation_content(uuid,uuid,integer,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'anon cannot execute editor autosave RPC'
);

set local role service_role;

select is(
  (select public.save_invitation_content(
    '10000000-0000-0000-0000-000000000001',
    id,
    1,
    '{"groom":{"name":"B"},"bride":{"name":"C"}}'::jsonb,
    null,
    '[{"id":"70000000-0000-0000-0000-000000000007","bankName":"Bank","accountNumber":"1","accountHolder":"A"}]'::jsonb,
    '{}'::jsonb
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  2,
  'generic autosave increments content_version'
);

select throws_ok(
  $$select public.save_invitation_content(
    '10000000-0000-0000-0000-000000000001',
    id,
    1,
    '{}'::jsonb
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001',
  'VERSION_CONFLICT:2',
  'stale autosave returns the current server version'
);

select throws_ok(
  $$select public.save_invitation_content(
    '20000000-0000-0000-0000-000000000002',
    id,
    2,
    '{}'::jsonb
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001',
  'NOT_FOUND',
  'cross-owner autosave fails without leaking the current version'
);

select is(
  (select status from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  'draft',
  'generic autosave cannot mutate lifecycle fields'
);

select is(
  ((select public.save_invitation_event(
    '10000000-0000-0000-0000-000000000001', id, 2, null,
    32766::smallint, 'akad', 'Akad', now(), null, 'Asia/Jakarta', '', '', null, null
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005')->>'content_version')::integer,
  3,
  'first high-position event is saved'
);

select is(
  ((select public.save_invitation_event(
    '10000000-0000-0000-0000-000000000001', id, 3, null,
    32767::smallint, 'resepsi', 'Resepsi', now(), null, 'Asia/Jakarta', '', '', null, null
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005')->>'content_version')::integer,
  4,
  'second high-position event is saved'
);

select is(
  (select public.reorder_invitation_events(
    '10000000-0000-0000-0000-000000000001',
    id,
    4,
    array(
      select e.id
      from public.invitation_events e
      where e.invitation_id = public.invitations.id
      order by e.position desc
    )
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  5,
  'reorder handles smallint boundary positions without overflow'
);

select is(
  (select event_type from public.invitation_events e
    join public.invitations i on i.id = e.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005' and e.position = 0),
  'resepsi',
  'reorder applies the requested order'
);

select is(
  (select count(distinct e.position) from public.invitation_events e
    join public.invitations i on i.id = e.invitation_id
    where i.client_ref = '50000000-0000-0000-0000-000000000005'),
  2::bigint,
  'reorder leaves no duplicate positions'
);

select throws_ok(
  $$select public.reorder_invitation_events(
    '10000000-0000-0000-0000-000000000001', id, 5,
    array[(select e.id from public.invitation_events e where e.invitation_id = public.invitations.id limit 1),
          (select e.id from public.invitation_events e where e.invitation_id = public.invitations.id limit 1)]
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'INVALID_EVENT_ORDER', 'duplicate event IDs are rejected'
);

select throws_ok(
  $$select public.reorder_invitation_events(
    '10000000-0000-0000-0000-000000000001', id, 5,
    array[(select e.id from public.invitation_events e where e.invitation_id = public.invitations.id limit 1)]
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'INVALID_EVENT_ORDER', 'partial event lists are rejected'
);

select throws_ok(
  $$select public.reorder_invitation_events(
    '10000000-0000-0000-0000-000000000001', id, 5,
    array['00000000-0000-0000-0000-000000000000'::uuid,
          (select e.id from public.invitation_events e where e.invitation_id = public.invitations.id limit 1)]
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'INVALID_EVENT_ORDER', 'foreign event IDs are rejected'
);

select throws_ok(
  $$select public.save_invitation_event(
    '10000000-0000-0000-0000-000000000001', id, 4, null,
    2::smallint, 'other', '', null, null, null, '', '', null, null
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'VERSION_CONFLICT:5', 'stale event save returns current server version'
);

reset role;
update public.invitations
set entitlement_tier_id = '30000000-0000-0000-0000-000000000003',
    entitlement_snapshot = '{
      "schema_version":1,
      "tier_code":"basic",
      "duration_months":1,
      "gallery_limit":0,
      "video_limit":0,
      "bank_account_limit":1,
      "audio_enabled":false,
      "audio_size_limit_mb":0,
      "watermark_enabled":true
    }'::jsonb,
    expires_at = now() + interval '1 month'
where client_ref = '50000000-0000-0000-0000-000000000005';
set local role service_role;
select throws_ok(
  $$select public.save_invitation_content(
    '10000000-0000-0000-0000-000000000001', id, 5, null, null,
    '[
      {"id":"70000000-0000-0000-0000-000000000007","bankName":"A","accountNumber":"1","accountHolder":"A"},
      {"id":"70000000-0000-0000-0000-000000000008","bankName":"B","accountNumber":"2","accountHolder":"B"}
    ]'::jsonb
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'LIMIT_CONFLICT:bankAccounts',
  'paid editor allowance comes from entitlement snapshot instead of the live tier row'
);

reset role;
update public.user_profiles
set account_status = 'pending_deletion',
    deletion_requested_at = now(),
    deletion_execute_after = now() + interval '7 days'
where id = '10000000-0000-0000-0000-000000000001';
set local role service_role;
select throws_ok(
  $$select public.save_invitation_content(
    '10000000-0000-0000-0000-000000000001', id, 5, '{}'::jsonb
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'INVALID_STATE', 'pending-deletion accounts cannot edit'
);
reset role;
update public.user_profiles
set account_status = 'active', deletion_requested_at = null, deletion_execute_after = null
where id = '10000000-0000-0000-0000-000000000001';
set local role service_role;

select is(
  (select public.delete_invitation_event(
    '10000000-0000-0000-0000-000000000001', id, 5,
    (select e.id from public.invitation_events e where e.invitation_id = public.invitations.id and e.position = 0)
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'),
  6,
  'event delete increments the parent revision'
);

select throws_ok(
  $$select public.delete_invitation_event(
    '10000000-0000-0000-0000-000000000001', id, 6,
    '00000000-0000-0000-0000-000000000000'
  ) from public.invitations where client_ref = '50000000-0000-0000-0000-000000000005'$$,
  'P0001', 'EVENT_NOT_FOUND', 'missing event delete is explicit'
);

reset role;
select * from finish();
rollback;

